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

/**
 * Admin limiter — 20 req / 15 min per IP in production, relaxed in dev.
 * Tightly restricts admin endpoint access regardless of auth status.
 * Effective even if a token is stolen — limits what an attacker can enumerate.
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many admin requests from this IP. Try again in 15 minutes.',
      statusCode: 429,
    })
  },
})

module.exports = { generalLimiter, authLimiter, sosLimiter, adminLimiter }
