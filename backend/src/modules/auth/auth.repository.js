const User = require('../../models/User.model')

/**
 * Auth Repository — Data access layer for auth operations
 * Controllers/Services NEVER query MongoDB directly — they use the repository.
 * This allows swapping the database without touching business logic.
 */

const authRepository = {
  /**
   * Find user by email (includes password for comparison)
   */
  findByEmail: async (email) => {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken')
  },

  /**
   * Find user by ID (excludes sensitive fields)
   */
  findById: async (id) => {
    return User.findById(id).select('-password -refreshToken')
  },

  /**
   * Create a new user
   */
  create: async (userData) => {
    const user = new User(userData)
    await user.save()
    return user
  },

  /**
   * Update user's refresh token (stored hashed)
   */
  updateRefreshToken: async (userId, token) => {
    return User.findByIdAndUpdate(userId, { refreshToken: token }, { new: true })
  },

  /**
   * Find user by refresh token
   */
  findByRefreshToken: async (token) => {
    return User.findOne({ refreshToken: token }).select('+refreshToken')
  },

  /**
   * Update last login timestamp
   */
  updateLastLogin: async (userId) => {
    return User.findByIdAndUpdate(userId, { lastLogin: new Date() })
  },

  /**
   * Check if email is already registered
   */
  emailExists: async (email) => {
    return User.exists({ email: email.toLowerCase() })
  },
}

module.exports = authRepository
