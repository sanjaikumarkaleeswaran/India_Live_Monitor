require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')
const logger = require('./src/utils/logger')

const PORT = process.env.PORT || 5000

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Smart India Live Monitor API running on port ${PORT}`)
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 API Base: http://localhost:${PORT}/api/v1`)
    })
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB:', err)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason)
  process.exit(1)
})
