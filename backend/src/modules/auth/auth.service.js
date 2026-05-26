const authRepository = require('./auth.repository')
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.utils')
const { AppError } = require('../../middleware/errorHandler')
const { sendEmail } = require('../../utils/email.utils')
const crypto = require('crypto')

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

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex')

    // Create user (password is hashed in the model pre-save hook)
    const user = await authRepository.create({ 
      name, email, phone, password,
      emailVerifyToken
    })

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerifyToken}`
    await sendEmail({
      to: user.email,
      subject: 'Verify your Smart India Live Monitor account',
      html: `<h2>Welcome to SILM, ${user.name}!</h2>
             <p>Please click the link below to verify your email address:</p>
             <a href="${verifyUrl}">Verify Email</a>`
    })

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

  /**
   * Verify Email
   */
  verifyEmail: async (token) => {
    if (!token) throw new AppError('Invalid token', 400)
    
    const user = await authRepository.findByVerificationToken(token)
    if (!user) throw new AppError('Invalid or expired verification token', 400)

    user.isEmailVerified = true
    user.emailVerifyToken = undefined
    await user.save()
    
    return true
  },

  /**
   * Forgot Password
   */
  forgotPassword: async (email) => {
    const user = await authRepository.findByEmail(email)
    if (!user) return // Silently return to prevent email enumeration

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = resetToken
    user.passwordResetExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    await sendEmail({
      to: user.email,
      subject: 'SILM Password Reset Request',
      html: `<h2>Password Reset</h2>
             <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
             <a href="${resetUrl}">Reset Password</a>`
    })
  },

  /**
   * Reset Password
   */
  resetPassword: async (token, newPassword) => {
    if (!token) throw new AppError('Invalid token', 400)

    const user = await authRepository.findByResetToken(token)
    if (!user) throw new AppError('Invalid or expired password reset token', 400)

    user.password = newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return true
  },
}

module.exports = authService
