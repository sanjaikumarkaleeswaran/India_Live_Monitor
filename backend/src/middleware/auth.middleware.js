const { verifyAccessToken } = require('../utils/jwt.utils')
const { AppError, asyncWrapper } = require('./errorHandler')
const User = require('../models/User.model')

/**
 * protect — Verifies JWT access token and attaches user to req.user
 * Must be used before any route that requires authentication
 */
const protect = asyncWrapper(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No authentication token provided. Please login.', 401)
  }

  const token = authHeader.split(' ')[1]

  // 2. Verify token signature and expiry
  const decoded = verifyAccessToken(token)

  // 3. Check if user still exists in DB (handles deleted accounts)
  const user = await User.findById(decoded.userId).select('-password -refreshToken')
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401)
  }

  // 4. Check if user account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401)
  }

  // 5. Attach user to request
  req.user = user
  next()
})

module.exports = { protect }
