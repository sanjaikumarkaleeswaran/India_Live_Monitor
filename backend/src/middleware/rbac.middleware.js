const { AppError } = require('./errorHandler')

/**
 * authorize — Role-Based Access Control (RBAC) middleware
 * Must be used AFTER protect middleware
 *
 * Usage: router.delete('/users/:id', protect, authorize('admin'), deleteUser)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
          403,
        ),
      )
    }

    next()
  }
}

// Convenience shortcuts
const adminOnly = authorize('admin')
const moderatorOrAdmin = authorize('admin', 'moderator')

module.exports = { authorize, adminOnly, moderatorOrAdmin }
