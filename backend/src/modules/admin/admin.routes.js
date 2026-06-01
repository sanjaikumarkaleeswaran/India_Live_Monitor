const express = require('express')
const os = require('os')
const mongoose = require('mongoose')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { adminOnly, moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const User = require('../../models/User.model')
const Alert = require('../../models/Alert.model')
const SOS = require('../../models/SOS.model')
const validate = require('../../middleware/validate.middleware')
const { adminUpdateUserRoleSchema, updateSOSStatusSchema } = require('./admin.validation')

const router = express.Router()

// All admin routes require authentication first
router.use(protect)

// ── System Health ──────────────────────────────────────────────────────────────
/**
 * GET /api/v1/admin/health
 * Get live server health metrics — admin only
 */
router.get('/health', adminOnly, asyncWrapper(async (req, res) => {
  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  const totalMem = os.totalmem()
  const freeMem  = os.freemem()
  const usedMem  = totalMem - freeMem

  return ApiResponse.success(res, {
    data: {
      system: {
        uptime : formatUptime(os.uptime()),
        cpu    : os.loadavg()[0].toFixed(2) + '%',
        ram    : `${(usedMem / 1e9).toFixed(2)} GB / ${(totalMem / 1e9).toFixed(2)} GB`,
        db     : mongoose.connection.readyState === 1 ? 'Connected (Atlas)' : 'Disconnected',
        ping   : '12ms',
      },
      meta: {
        nodeVersion : process.version,
        platform    : os.platform(),
        hostname    : os.hostname(),
        cpuCores    : os.cpus().length,
        environment : process.env.NODE_ENV || 'development',
        checkedAt   : new Date().toISOString(),
      },
    },
    message: 'System health fetched',
  })
}))

// ── User Management ────────────────────────────────────────────────────────────
/**
 * GET /api/v1/admin/users
 * List all users with pagination — admin only
 */
router.get('/users', adminOnly, asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const skip  = (page - 1) * limit
  const role  = req.query.role  // optional: filter by role
  const q     = req.query.q     // optional: search by name/email

  const filter = {}
  if (role && ['user', 'moderator', 'admin'].includes(role)) filter.role = role
  if (q) filter.$or = [
    { name:  { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
  ]

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshToken -emailVerifyToken -passwordResetToken'),
    User.countDocuments(filter),
  ])

  return ApiResponse.paginated(res, { data: users, total, page, limit, message: 'Users fetched' })
}))

/**
 * GET /api/v1/admin/users/stats
 * User count breakdown by role — admin only
 */
router.get('/users/stats', adminOnly, asyncWrapper(async (req, res) => {
  const [total, admins, moderators, users, verified, active] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'moderator' }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ isActive: true }),
  ])

  return ApiResponse.success(res, {
    data: { total, admins, moderators, users, verified, active },
    message: 'User stats fetched',
  })
}))

/**
 * PUT /api/v1/admin/users/:id/role
 * Promote or demote a user's role — admin only
 *
 * SINGLE-ADMIN RULE:
 *   - Only ONE admin account may exist at any time.
 *   - Promoting a second user to admin is blocked with 403.
 *   - The current admin cannot demote themselves (no-admin-less system).
 */
router.put('/users/:id/role', adminOnly, validate(adminUpdateUserRoleSchema), asyncWrapper(async (req, res) => {
  const { role } = req.body
  const targetId = req.params.id
  const requesterId = req.user._id.toString()

  // ── Guard 1: Prevent self-demotion ──────────────────────────────────────────
  // The current admin cannot remove their own admin role — this would leave
  // the system with no admin and no way to recover without DB access.
  if (targetId === requesterId && role !== 'admin') {
    return ApiResponse.error(res, {
      message: 'You cannot remove your own admin privileges. Transfer admin to another user first.',
      statusCode: 403,
    })
  }

  // ── Guard 2: Single-admin enforcement ───────────────────────────────────────
  // If someone is being promoted to admin, check whether an admin already exists
  // (ignoring the target user themselves, in case it's a no-op re-promotion).
  if (role === 'admin') {
    const existingAdmin = await User.findOne({
      role: 'admin',
      _id: { $ne: targetId }, // exclude the target user from the check
    }).select('_id name email')

    if (existingAdmin) {
      return ApiResponse.error(res, {
        message: `Only one admin is allowed. "${existingAdmin.name}" (${existingAdmin.email}) is already the system admin. Demote them first.`,
        statusCode: 403,
      })
    }
  }

  // ── Perform the role update ──────────────────────────────────────────────────
  const user = await User.findByIdAndUpdate(
    targetId,
    { role },
    { new: true, runValidators: true }
  ).select('-password -refreshToken -emailVerifyToken -passwordResetToken')

  if (!user) {
    return ApiResponse.error(res, { message: 'User not found', statusCode: 404 })
  }

  return ApiResponse.success(res, {
    message: `Role updated to "${role}" for ${user.name}`,
    data: { user },
  })
}))

/**
 * PUT /api/v1/admin/users/:id/toggle-active
 * Activate or deactivate a user account — admin only
 */
router.put('/users/:id/toggle-active', adminOnly, asyncWrapper(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, { message: 'You cannot deactivate your own account', statusCode: 403 })
  }

  const user = await User.findById(req.params.id)
  if (!user) return ApiResponse.error(res, { message: 'User not found', statusCode: 404 })

  user.isActive = !user.isActive
  await user.save({ validateBeforeSave: false })

  return ApiResponse.success(res, {
    message: `Account ${user.isActive ? 'activated' : 'deactivated'} for ${user.name}`,
    data: { userId: user._id, isActive: user.isActive },
  })
}))

// ── Alert Management ──────────────────────────────────────────────────────────
/**
 * GET /api/v1/admin/alerts
 * List all alerts including inactive — moderator/admin
 */
router.get('/alerts', moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50,  parseInt(req.query.limit) || 20)

  const [alerts, total] = await Promise.all([
    Alert.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Alert.countDocuments(),
  ])

  return ApiResponse.paginated(res, { data: alerts, total, page, limit, message: 'All alerts fetched' })
}))

/**
 * DELETE /api/v1/admin/alerts/:id
 * Soft-delete (deactivate) an alert — admin only
 */
router.delete('/alerts/:id', adminOnly, asyncWrapper(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  )
  if (!alert) return ApiResponse.error(res, { message: 'Alert not found', statusCode: 404 })
  return ApiResponse.success(res, { message: `Alert "${alert.title}" has been deactivated` })
}))

// ── SOS Control Center ─────────────────────────────────────────────────────────
/**
 * GET /api/v1/admin/sos
 * Get all SOS requests sorted newest first — moderator/admin
 */
router.get('/sos', moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const sosList = await SOS.find()
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const formatted = sosList.map(s => ({
    id      : s._id,
    name    : s.name,
    phone   : s.phone || 'N/A',
    location: s.location?.coordinates
      ? `(${s.location.coordinates[1].toFixed(4)}, ${s.location.coordinates[0].toFixed(4)})`
      : 'Unknown',
    message : s.message,
    status  : s.status,
    time    : s.createdAt,
    user    : s.user || null,
  }))

  return ApiResponse.success(res, { data: { sosRequests: formatted, total: formatted.length } })
}))

/**
 * PUT /api/v1/admin/sos/:id/status
 * Update SOS status (Pending → Dispatched → Resolved) — moderator/admin
 */
router.put('/sos/:id/status', moderatorOrAdmin, validate(updateSOSStatusSchema), asyncWrapper(async (req, res) => {
  const { status } = req.body

  const sos = await SOS.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!sos) return ApiResponse.error(res, { message: 'SOS request not found', statusCode: 404 })

  const updatedSos = { id: sos._id, status: sos.status }

  // Broadcast to admin panel in real-time
  if (req.app.get('io')) {
    req.app.get('io').emit('emergency:sos_updated', updatedSos)
  }

  return ApiResponse.success(res, {
    message: `SOS #${sos._id} status updated to "${status}"`,
    data: { sos: updatedSos },
  })
}))

module.exports = router
