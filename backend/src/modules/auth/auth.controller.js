const authService = require('./auth.service')
const ApiResponse = require('../../utils/apiResponse')
const { setRefreshCookie, clearRefreshCookie } = require('../../utils/jwt.utils')
const { asyncWrapper } = require('../../middleware/errorHandler')

/**
 * Auth Controller — HTTP layer only
 * Extracts inputs → calls service → sends response
 * No business logic here.
 */

/**
 * POST /api/v1/auth/register
 */
const register = asyncWrapper(async (req, res) => {
  const { name, email, phone, password } = req.body

  const { user, accessToken, refreshToken } = await authService.register({
    name, email, phone, password,
  })

  // Set refresh token as httpOnly cookie (XSS-safe)
  setRefreshCookie(res, refreshToken)

  return ApiResponse.created(res, {
    message: 'Account created successfully! Welcome to Smart India Live Monitor.',
    data: { user, accessToken },
  })
})

/**
 * POST /api/v1/auth/login
 */
const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body

  const { user, accessToken, refreshToken } = await authService.login({ email, password })

  setRefreshCookie(res, refreshToken)

  return ApiResponse.success(res, {
    message: `Welcome back, ${user.name.split(' ')[0]}!`,
    data: { user, accessToken },
  })
})

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncWrapper(async (req, res) => {
  // Clear server-side refresh token if user is authenticated
  if (req.user) {
    await authService.logout(req.user._id)
  }

  clearRefreshCookie(res)

  return ApiResponse.success(res, { message: 'Logged out successfully' })
})

/**
 * POST /api/v1/auth/refresh-token
 * Uses the httpOnly cookie — no body needed
 */
const refreshToken = asyncWrapper(async (req, res) => {
  const token = req.cookies.refreshToken

  const { accessToken, user } = await authService.refreshToken(token)

  return ApiResponse.success(res, {
    message: 'Token refreshed',
    data: { accessToken, user },
  })
})

/**
 * POST /api/v1/auth/forgot-password
 * (Phase 2 — email functionality)
 */
const forgotPassword = asyncWrapper(async (req, res) => {
  return ApiResponse.success(res, {
    message: 'If an account with that email exists, a password reset link has been sent.',
  })
})

module.exports = { register, login, logout, refreshToken, forgotPassword }
