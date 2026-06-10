const express = require('express')
const { protect } = require('../../middleware/auth.middleware')
const { adminOnly } = require('../../middleware/rbac.middleware')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const User = require('../../models/User.model')
const validate = require('../../middleware/validate.middleware')
const { updateUserProfileSchema, updateUserRoleSchema } = require('./user.validation')

const router = express.Router()

// All user routes require authentication
router.use(protect)

/**
 * GET /api/v1/users/me
 * Get current authenticated user's profile
 */
router.get('/me', asyncWrapper(async (req, res) => {
  return ApiResponse.success(res, {
    data: { user: req.user.toPublicJSON ? req.user.toPublicJSON() : req.user },
  })
}))

/**
 * PUT /api/v1/users/me
 * Update current user's profile
 */
router.put('/me', validate(updateUserProfileSchema), asyncWrapper(async (req, res) => {
  const { name, phone, state, city, preferences } = req.body
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, state, city, preferences },
    { new: true, runValidators: true },
  )
  return ApiResponse.success(res, { message: 'Profile updated', data: { user } })
}))

/**
 * GET /api/v1/users/leaderboard
 * Get top users by trust score (Gamification)
 */
router.get('/leaderboard', asyncWrapper(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10
  const users = await User.find({ trustScore: { $gt: 0 } })
    .select('name avatar city state trustScore badges reportsSubmitted')
    .sort({ trustScore: -1 })
    .limit(limit)
    .lean()

  return ApiResponse.success(res, { data: { leaderboard: users } })
}))

/**
 * GET /api/v1/users
 * Admin: List all users
 */
router.get('/', adminOnly, asyncWrapper(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1
  const limit = parseInt(req.query.limit) || 20
  const skip  = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ])

  return ApiResponse.paginated(res, { data: users, total, page, limit })
}))

/**
 * PUT /api/v1/users/:id/role
 * Admin: Change a user's role
 */
router.put('/:id/role', adminOnly, validate(updateUserRoleSchema), asyncWrapper(async (req, res) => {
  const { role } = req.body
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
  if (!user) return ApiResponse.error(res, { message: 'User not found', statusCode: 404 })
  return ApiResponse.success(res, { message: 'Role updated', data: { user } })
}))

module.exports = router
