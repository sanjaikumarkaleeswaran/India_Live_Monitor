const jwt = require('jsonwebtoken')

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRE  = process.env.JWT_ACCESS_EXPIRE  || '15m'
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d'

/**
 * Generate a JWT access token (short-lived, 15 minutes)
 */
const generateAccessToken = (payload) => {
  if (!ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET not configured')
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRE })
}

/**
 * Generate a JWT refresh token (long-lived, 7 days)
 * Stored as httpOnly cookie — not in localStorage
 */
const generateRefreshToken = (payload) => {
  if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not configured')
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE })
}

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET)
}

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET)
}

/**
 * Set refresh token as secure httpOnly cookie
 * httpOnly: JS cannot access (XSS protection)
 * secure: HTTPS only in production
 * sameSite: CSRF protection
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/v1/auth',
  })
}

/**
 * Clear refresh token cookie
 */
const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/api/v1/auth',
  })
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
}
