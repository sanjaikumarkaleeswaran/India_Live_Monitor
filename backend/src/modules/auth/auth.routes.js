const express = require('express')
const { register, login, logout, refreshToken, forgotPassword, resetPassword, verifyEmail } = require('./auth.controller')
const { protect } = require('../../middleware/auth.middleware')
const { authLimiter } = require('../../middleware/rateLimiter')
const validate = require('../../middleware/validate.middleware')
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} = require('./auth.validation')

const router = express.Router()

// Strict rate limiting on all auth endpoints
router.use(authLimiter)

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), register)

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and receive JWT tokens
 * @access  Public
 */
router.post('/login', validate(loginSchema), login)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout and clear refresh token
 * @access  Private (optional — clears cookie regardless)
 */
router.post('/logout', logout)

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token using refresh cookie
 * @access  Public (uses httpOnly cookie)
 */
router.post('/refresh-token', refreshToken)

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address using token
 * @access  Public
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)

module.exports = router
