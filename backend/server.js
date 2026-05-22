require('dotenv').config()
const http = require('http')
const socketIo = require('socket.io')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const logger = require('./src/utils/logger')

const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for dev/testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
})

// Store io on app so routes can access it
app.set('io', io)

// Socket connection handler
io.on('connection', (socket) => {
  logger.info(`🔌 Real-time client connected: ${socket.id}`)

  socket.on('join', (room) => {
    socket.join(room)
    logger.info(`👤 Client ${socket.id} joined room: ${room}`)
  })

  // Listen for emergency SOS coordinates updates
  socket.on('emergency:location_update', (data) => {
    logger.info(`🆘 Location update for SOS ${data.sosId}:`, data.location)
    // Broadcast to dashboard or admin rooms
    io.emit('emergency:location_updated', data)
  })

  socket.on('disconnect', () => {
    logger.info(`🔌 Real-time client disconnected: ${socket.id}`)
  })
})

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
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
