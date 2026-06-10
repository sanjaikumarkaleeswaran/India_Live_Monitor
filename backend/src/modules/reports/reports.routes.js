const express = require('express')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const Report = require('../../models/Report.model')
const User = require('../../models/User.model')
const validate = require('../../middleware/validate.middleware')
const { createReportSchema, updateReportStatusSchema } = require('./reports.validation')

const router = express.Router()

/**
 * GET /api/v1/reports
 * Get paginated list of active/under-review reports
 */
router.get('/', asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit
  const { category, status } = req.query

  const filter = {}
  if (category) filter.category = category
  if (status) filter.status = status

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter)
  ])

  // Map database properties to match the frontend expectations
  const formattedReports = reports.map(r => ({
    id: r._id,
    title: r.title,
    desc: r.description,
    category: r.category,
    location: r.locationName,
    verified: r.verifiedUsers?.length || 0,
    flagged: r.flaggedUsers?.length || 0,
    status: r.status,
    reporter: r.reporter,
    createdAt: r.createdAt
  }))

  return ApiResponse.paginated(res, {
    data: formattedReports,
    total,
    page,
    limit,
    message: 'Citizen reports fetched successfully'
  })
}))

/**
 * POST /api/v1/reports
 * Create a new civic report (authenticated users)
 */
router.post('/', protect, validate(createReportSchema), asyncWrapper(async (req, res) => {
  const { title, description, desc, category, locationName, location } = req.body

  // Handle both 'desc' (from frontend form) and 'description'
  const reportDescription = description || desc

  const coordinates = location?.coordinates || [78.9629, 20.5937]

  const report = await Report.create({
    title,
    description: reportDescription,
    category,
    locationName,
    location: {
      type: 'Point',
      coordinates
    },
    reporter: req.user._id,
    verifiedUsers: [req.user._id], // Self-verify by default
    status: 'Active'
  })

  // Gamification: Update user's submitted reports and trust score (+10 points)
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { reportsSubmitted: 1, trustScore: 10 }
  })

  // Format response to match frontend expectations
  const formattedReport = {
    id: report._id,
    title: report.title,
    desc: report.description,
    category: report.category,
    location: report.locationName,
    verified: 1,
    flagged: 0,
    status: report.status,
    reporter: { _id: req.user._id, name: req.user.name },
    createdAt: report.createdAt
  }

  // Trigger websocket broadcast for new citizen report
  if (req.app.get('io')) {
    req.app.get('io').emit('report:new', formattedReport)
  }

  return ApiResponse.created(res, {
    message: 'Civic report published successfully',
    data: { report: formattedReport }
  })
}))

/**
 * POST /api/v1/reports/:id/verify
 * Upvote/verify a citizen report
 */
router.post('/:id/verify', protect, asyncWrapper(async (req, res) => {
  const report = await Report.findById(req.params.id)
  if (!report) {
    return ApiResponse.error(res, { message: 'Report not found', statusCode: 404 })
  }

  const userId = req.user._id

  // Remove from flagged if they had flagged it
  report.flaggedUsers = report.flaggedUsers.filter(id => !id.equals(userId))

  // Toggle verification status
  const isVerified = report.verifiedUsers.some(id => id.equals(userId))
  if (isVerified) {
    report.verifiedUsers = report.verifiedUsers.filter(id => !id.equals(userId))
    // Gamification: remove points
    await User.findByIdAndUpdate(userId, { $inc: { reportsVerified: -1, trustScore: -2 } })
  } else {
    report.verifiedUsers.push(userId)
    // Gamification: add points
    await User.findByIdAndUpdate(userId, { $inc: { reportsVerified: 1, trustScore: 2 } })
  }

  await report.save()

  const formattedReport = {
    id: report._id,
    verified: report.verifiedUsers.length,
    flagged: report.flaggedUsers.length,
    status: report.status
  }

  // Trigger websocket broadcast for report update
  if (req.app.get('io')) {
    req.app.get('io').emit('report:update', formattedReport)
  }

  return ApiResponse.success(res, {
    message: isVerified ? 'Verification removed' : 'Report verified successfully',
    data: { report: formattedReport }
  })
}))

/**
 * POST /api/v1/reports/:id/flag
 * Flag a report as false / spam
 */
router.post('/:id/flag', protect, asyncWrapper(async (req, res) => {
  const report = await Report.findById(req.params.id)
  if (!report) {
    return ApiResponse.error(res, { message: 'Report not found', statusCode: 404 })
  }

  const userId = req.user._id

  // Remove from verified if they had verified it
  report.verifiedUsers = report.verifiedUsers.filter(id => !id.equals(userId))

  // Toggle flag status
  const isFlagged = report.flaggedUsers.some(id => id.equals(userId))
  if (isFlagged) {
    report.flaggedUsers = report.flaggedUsers.filter(id => !id.equals(userId))
  } else {
    report.flaggedUsers.push(userId)
  }

  // If a report crosses 5 flags, change its status to 'Under Review'
  if (report.flaggedUsers.length >= 5 && report.status === 'Active') {
    report.status = 'Under Review'
  }

  await report.save()

  const formattedReport = {
    id: report._id,
    verified: report.verifiedUsers.length,
    flagged: report.flaggedUsers.length,
    status: report.status
  }

  // Trigger websocket broadcast for report update
  if (req.app.get('io')) {
    req.app.get('io').emit('report:update', formattedReport)
  }

  return ApiResponse.success(res, {
    message: isFlagged ? 'Flag removed' : 'Report flagged for moderation',
    data: { report: formattedReport }
  })
}))

/**
 * PUT /api/v1/reports/:id/status
 * Update report status (moderator/admin only)
 */
router.put('/:id/status', protect, moderatorOrAdmin, validate(updateReportStatusSchema), asyncWrapper(async (req, res) => {
  const { status } = req.body

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )

  if (!report) {
    return ApiResponse.error(res, { message: 'Report not found', statusCode: 404 })
  }

  const formattedReport = {
    id: report._id,
    status: report.status
  }

  // Trigger websocket broadcast for report status update
  if (req.app.get('io')) {
    req.app.get('io').emit('report:update', formattedReport)
  }

  return ApiResponse.success(res, {
    message: `Report status updated to ${status}`,
    data: { report: formattedReport }
  })
}))

/**
 * DELETE /api/v1/reports/:id
 * Delete report (moderator/admin only)
 */
router.delete('/:id', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id)
  if (!report) {
    return ApiResponse.error(res, { message: 'Report not found', statusCode: 404 })
  }

  // Trigger websocket broadcast for deletion
  if (req.app.get('io')) {
    req.app.get('io').emit('report:delete', { id: req.params.id })
  }

  return ApiResponse.success(res, { message: 'Report deleted successfully' })
}))

module.exports = router
