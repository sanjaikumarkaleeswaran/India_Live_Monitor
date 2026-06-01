const rateLimit = require('express-rate-limit')
const ApiResponse = require('../utils/apiResponse')

const keyGenerator = (req) => {
  return req.user ? `${req.ip}_${req.user.id}` : req.ip;
};

/**
 * General API rate limiter — 100 requests per 15 minutes per IP/User
 * Protects against brute force and scraping
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
    })
  },
})

/**
 * Strict auth limiter — 10 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'Too many login attempts. Please try again later.',
      statusCode: 429,
    })
  },
})

/**
 * SOS limiter — 5 requests per 1 minute
 */
const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(res, {
      message: 'SOS rate limit reached. Please try again later.',
      statusCode: 429,
    })
  },
})

/**
 * Admin limiter — 20 req / 15 min per IP in production, relaxed in dev.
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  keyGenerator,
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
