const authRepository = require('./auth.repository')
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.utils')
const { AppError } = require('../../middleware/errorHandler')

/**
 * Auth Service — Business logic layer
 * Sits between Controller and Repository
 * Handles: token generation, password comparison, business rules
 */
const authService = {
  /**
   * Register a new user
   */
  register: async ({ name, email, phone, password }) => {
    // Check if email already in use
    const exists = await authRepository.emailExists(email)
    if (exists) {
      throw new AppError('An account with this email already exists', 409)
    }

    // Create user (password is hashed in the model pre-save hook)
    const user = await authRepository.create({ name, email, phone, password })

    // Generate tokens
    const tokenPayload = { userId: user._id, role: user.role }
    const accessToken  = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Store refresh token
    await authRepository.updateRefreshToken(user._id, refreshToken)
    await authRepository.updateLastLogin(user._id)

    return { user: user.toPublicJSON(), accessToken, refreshToken }
  },

  /**
   * Login a user
   */
  login: async ({ email, password }) => {
    // Find user with password
    const user = await authRepository.findByEmail(email)
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    // Check account is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact support.', 401)
    }

    // Compare password
    const isValid = await user.comparePassword(password)
    if (!isValid) {
      throw new AppError('Invalid email or password', 401)
    }

    // Generate tokens
    const tokenPayload = { userId: user._id, role: user.role }
    const accessToken  = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Store new refresh token & update last login
    await authRepository.updateRefreshToken(user._id, refreshToken)
    await authRepository.updateLastLogin(user._id)

    return { user: user.toPublicJSON(), accessToken, refreshToken }
  },

  /**
   * Refresh access token using refresh token from cookie
   */
  refreshToken: async (token) => {
    if (!token) throw new AppError('No refresh token provided', 401)

    const { verifyRefreshToken } = require('../../utils/jwt.utils')
    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      throw new AppError('Invalid or expired refresh token. Please login again.', 401)
    }

    const user = await authRepository.findById(decoded.userId)
    if (!user) throw new AppError('User not found', 401)

    // Generate new access token only (refresh token rotation is optional)
    const accessToken = generateAccessToken({ userId: user._id, role: user.role })

    return { accessToken, user: user.toPublicJSON() }
  },

  /**
   * Logout — clear the stored refresh token
   */
  logout: async (userId) => {
    await authRepository.updateRefreshToken(userId, null)
  },
}

module.exports = authService
