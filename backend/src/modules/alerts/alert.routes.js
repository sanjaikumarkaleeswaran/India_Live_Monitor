const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const Alert = require('../../models/Alert.model')

const router = express.Router()

// Seed alerts (realistic India-specific alerts)
const MOCK_ALERTS = [
  {
    title: 'Cyclone Mocha Warning — Bay of Bengal',
    description: 'A very severe cyclonic storm is likely to make landfall near Andhra Pradesh coast. High waves and strong winds expected. Coastal populations advised to evacuate.',
    type: 'Cyclone Warning', severity: 'critical', category: 'weather',
    affectedStates: ['AP', 'OD', 'WB'],
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Heatwave Alert — Rajasthan & Haryana',
    description: 'Maximum temperatures expected to remain 46–48°C for the next 3 days. Avoid outdoor exposure between 11am–4pm. Stay hydrated.',
    type: 'Heatwave Alert', severity: 'high', category: 'weather',
    affectedStates: ['RJ', 'HR', 'UP'],
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Flood Warning — Brahmaputra River Basin',
    description: 'River water level is above danger mark at multiple gauging stations. Low-lying areas advised to move to higher ground. NDRF teams deployed.',
    type: 'Flood Warning', severity: 'high', category: 'disaster',
    affectedStates: ['AS', 'AR'],
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Air Quality Hazardous — Delhi NCR',
    description: 'AQI has crossed 400 in multiple Delhi monitoring stations. Outdoor activities strongly discouraged. Schools may be advised to close.',
    type: 'Air Quality Alert', severity: 'medium', category: 'health',
    affectedStates: ['DL', 'HR', 'UP'],
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Heavy Rainfall Alert — Mumbai Suburban',
    description: 'IMD issues red alert for Mumbai Metropolitan Region. Expected rainfall: 150mm in 24 hours. Low-lying areas prone to waterlogging.',
    type: 'Rainfall Alert', severity: 'high', category: 'weather',
    affectedStates: ['MH'],
    source: 'official', isActive: true, isVerified: true,
  },
]

/**
 * GET /api/v1/alerts
 * Get paginated list of active alerts
 */
router.get('/', asyncWrapper(async (req, res) => {
  const page     = parseInt(req.query.page)     || 1
  const limit    = parseInt(req.query.limit)    || 10
  const severity = req.query.severity
  const category = req.query.category

  // Build filter
  const filter = { isActive: true }
  if (severity) filter.severity = severity
  if (category) filter.category = category

  let alerts = await Alert.find(filter)
    .sort({ severity: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  // Fall back to mock alerts if DB is empty
  if (alerts.length === 0) {
    alerts = MOCK_ALERTS.map((a, i) => ({
      ...a,
      _id: `mock_${i}`,
      createdAt: new Date(Date.now() - i * 3600000),
      updatedAt: new Date(),
    }))
  }

  return ApiResponse.paginated(res, {
    data: alerts,
    total: alerts.length,
    page,
    limit,
    message: 'Alerts fetched successfully',
  })
}))

/**
 * GET /api/v1/alerts/:id
 * Get a single alert
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const alert = await Alert.findById(req.params.id)
  if (!alert) return ApiResponse.error(res, { message: 'Alert not found', statusCode: 404 })
  return ApiResponse.success(res, { data: { alert } })
}))

/**
 * POST /api/v1/alerts
 * Create alert (moderator/admin only)
 */
router.post('/', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const alert = await Alert.create({ ...req.body, createdBy: req.user._id })
  return ApiResponse.created(res, { message: 'Alert created', data: { alert } })
}))

/**
 * PUT /api/v1/alerts/:id
 * Update alert (moderator/admin only)
 */
router.put('/:id', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!alert) return ApiResponse.error(res, { message: 'Alert not found', statusCode: 404 })
  return ApiResponse.success(res, { message: 'Alert updated', data: { alert } })
}))

/**
 * DELETE /api/v1/alerts/:id
 * Soft delete alert (admin only)
 */
const { adminOnly } = require('../../middleware/rbac.middleware')
router.delete('/:id', protect, adminOnly, asyncWrapper(async (req, res) => {
  await Alert.findByIdAndUpdate(req.params.id, { isActive: false })
  return ApiResponse.success(res, { message: 'Alert deactivated' })
}))

module.exports = router
