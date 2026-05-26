const express = require('express')
const { protect } = require('../../middleware/auth.middleware')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const Notification = require('../../models/Notification.model')

const router = express.Router()

// All routes require authentication
router.use(protect)

/**
 * GET /api/v1/notifications
 * Get user's notifications (paginated)
 */
router.get('/', asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ])

  return ApiResponse.paginated(res, {
    data: notifications,
    total,
    page,
    limit,
    meta: { unreadCount }
  })
}))

/**
 * PUT /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', asyncWrapper(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  )

  if (!notification) {
    return ApiResponse.error(res, { message: 'Notification not found', statusCode: 404 })
  }

  return ApiResponse.success(res, { message: 'Marked as read', data: notification })
}))

/**
 * PUT /api/v1/notifications/read-all
 * Mark all user's notifications as read
 */
router.put('/read-all', asyncWrapper(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  )

  return ApiResponse.success(res, { message: 'All notifications marked as read' })
}))

module.exports = router
