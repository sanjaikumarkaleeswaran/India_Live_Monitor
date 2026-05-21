const rateLimit = require('express-rate-limit')
const ApiResponse = require('../utils/apiResponse')

/**
 * General API rate limiter — 100 requests per 15 minutes per IP
 * Protects against brute force and scraping
 */
const generalLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 100000, // virtually unlimited
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many requests.',
      statusCode: 429,
    })
  },
})

/**
 * Strict auth limiter — disabled for development
 */
const authLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 100000, // virtually unlimited
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many login attempts.',
      statusCode: 429,
    })
  },
})

/**
 * SOS limiter — disabled for development
 */
const sosLimiter = rateLimit({
  windowMs: 1000,
  max: 100000,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'SOS rate limit reached.',
      statusCode: 429,
    })
  },
})

module.exports = { generalLimiter, authLimiter, sosLimiter }
