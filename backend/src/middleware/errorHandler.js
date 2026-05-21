const logger = require('../utils/logger')

/**
 * Global Express error handler (must be 4-argument middleware)
 *
 * Catches all errors thrown/passed via next(err) throughout the app.
 * Sends a consistent JSON error response without leaking stack traces in production.
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log the error with full details
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl, method: req.method })

  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // ── Mongoose Validation Error ──────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    return res.status(400).json({ success: false, message: 'Validation failed', errors })
  }

  // ── Mongoose Duplicate Key ─────────────────────────────
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue)[0]
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
  }

  // ── JWT Errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token. Please login again.'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired. Please login again.'
  }

  // ── Mongoose Cast Error (invalid ObjectId) ─────────────
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // ── Response ───────────────────────────────────────────
  const response = { success: false, message }

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
  }

  return res.status(statusCode).json(response)
}

/**
 * AppError — Custom error class with HTTP status codes
 * Use: throw new AppError('Not found', 404)
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * asyncWrapper — Wraps async route handlers to eliminate try/catch boilerplate
 * Use: router.get('/route', asyncWrapper(async (req, res) => { ... }))
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = { globalErrorHandler, AppError, asyncWrapper }
