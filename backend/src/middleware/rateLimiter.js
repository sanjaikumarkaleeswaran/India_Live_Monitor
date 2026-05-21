const rateLimit = require('express-rate-limit')
const ApiResponse = require('../utils/apiResponse')

/**
 * General API rate limiter — 100 requests per 15 minutes per IP
 * Protects against brute force and scraping
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many requests. Please try again after 15 minutes.',
      statusCode: 429,
    })
  },
})

/**
 * Strict auth limiter — 10 requests per hour per IP
 * Prevents brute-force login attacks
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many login attempts. Please try again after 1 hour.',
      statusCode: 429,
    })
  },
})

/**
 * SOS limiter — prevent SOS spam (5 per hour)
 */
const sosLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'SOS rate limit reached. Please contact emergency services directly.',
      statusCode: 429,
    })
  },
})

module.exports = { generalLimiter, authLimiter, sosLimiter }
