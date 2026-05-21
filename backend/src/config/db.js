const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    const conn = await mongoose.connect(uri, {
      // These options are defaults in Mongoose 7+ but explicit for clarity
      serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
      socketTimeoutMS: 45000,
    })

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`)

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })

    return conn
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`)
    throw error
  }
}

module.exports = connectDB
