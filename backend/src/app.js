const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const { globalErrorHandler } = require('./middleware/errorHandler')
const { generalLimiter } = require('./middleware/rateLimiter')
const authRoutes = require('./modules/auth/auth.routes')
const userRoutes = require('./modules/users/user.routes')
const fuelRoutes = require('./modules/fuel/fuel.routes')
const alertRoutes = require('./modules/alerts/alert.routes')
const emergencyRoutes = require('./modules/emergency/emergency.routes')
const weatherRoutes = require('./modules/weather/weather.routes')
const aqiRoutes = require('./modules/aqi/aqi.routes')
const reportRoutes = require('./modules/reports/reports.routes')
const safetyRoutes = require('./modules/safety/safety.routes')
const notificationRoutes = require('./modules/notifications/notification.routes')
const logger = require('./utils/logger')

const app = express()

// ── Security Middleware ────────────────────────────────────
// Helmet: sets 14+ security HTTP headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for maps
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}))

// CORS: dynamically allow configured origin and localhost ports in development
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    // Allow configured origins or any localhost origin
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting: 100 requests per 15 minutes per IP
app.use('/api/', generalLimiter)

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))          // Prevent large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// ── NoSQL Injection Protection ─────────────────────────────
// Removes $ and . from user input to prevent MongoDB operator injection
app.use(mongoSanitize())

// ── HTTP Request Logger ────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }))
}

const os = require('os')
const mongoose = require('mongoose')

// ── Health Check ───────────────────────────────────────────
const healthCheckHandler = (req, res) => {
  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    return `${d}d ${h}h ${m}m`
  }

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem

  res.status(200).json({
    status: 'ok',
    app: 'Smart India Live Monitor API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    system: {
      uptime: formatUptime(os.uptime()),
      cpu: os.loadavg()[0].toFixed(2) + '%',
      ram: `${(usedMem / 1e9).toFixed(2)} GB / ${(totalMem / 1e9).toFixed(2)} GB`,
      db: mongoose.connection.readyState === 1 ? 'Connected (Atlas)' : 'Disconnected',
      ping: '12ms' // Mocked ping for simplicity
    }
  })
}

app.get('/health', healthCheckHandler)
app.get('/api/v1/system/health', healthCheckHandler)

// ── API Routes ─────────────────────────────────────────────
app.use('/api/v1/auth',       authRoutes)
app.use('/api/v1/users',      userRoutes)
app.use('/api/v1/fuel',       fuelRoutes)
app.use('/api/v1/alerts',     alertRoutes)
app.use('/api/v1/emergency',  emergencyRoutes)
app.use('/api/v1/weather',    weatherRoutes)
app.use('/api/v1/aqi',        aqiRoutes)
app.use('/api/v1/reports',    reportRoutes)
app.use('/api/v1/safety',     safetyRoutes)
app.use('/api/v1/notifications', notificationRoutes)

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
})

// ── Global Error Handler (must be last) ───────────────────
app.use(globalErrorHandler)

module.exports = app
