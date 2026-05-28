const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const Alert = require('../../models/Alert.model')
const { fetchLiveGDACSAlerts } = require('./gdacs.service')

const router = express.Router()

// Seed alerts (realistic India-specific alerts)
const MOCK_ALERTS = [
  {
    title: '[SIMULATION] Coastal Storm Warning',
    description: '(Mock Data) A simulated severe cyclonic storm for testing purposes. No actual threat exists. Simulated waves and strong winds in test environment.',
    type: 'Cyclone Warning', severity: 'critical', category: 'weather',
    affectedStates: ['Andhra Pradesh', 'Odisha', 'West Bengal'],
    location: { type: 'Point', coordinates: [83.2185, 15.9129] }, // AP coast
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] Regional Heatwave Alert',
    description: '(Mock Data) Simulated maximum temperatures of 46–48°C for testing the heatwave alert system. This is not a real weather forecast.',
    type: 'Heatwave Alert', severity: 'high', category: 'weather',
    affectedStates: ['Rajasthan', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [75.7873, 26.9124] }, // Jaipur
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] River Basin Flood Warning',
    description: '(Mock Data) Simulated water level crossing danger marks for system testing. No actual flooding is occurring in these regions.',
    type: 'Flood Warning', severity: 'high', category: 'disaster',
    affectedStates: ['Assam', 'Arunachal Pradesh'],
    location: { type: 'Point', coordinates: [93.6053, 26.1445] }, // Guwahati
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] Air Quality Alert',
    description: '(Mock Data) Simulated hazardous AQI values generated for testing dashboard responses. Not based on real-time sensors.',
    type: 'Air Quality Alert', severity: 'medium', category: 'health',
    affectedStates: ['Delhi', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // Delhi
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] Heavy Rainfall Alert',
    description: '(Mock Data) Simulated heavy rainfall alert (150mm/24h) for testing weather warning systems. This is a simulated event.',
    type: 'Rainfall Alert', severity: 'high', category: 'weather',
    affectedStates: ['Maharashtra'],
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] Landslide Risk',
    description: '(Mock Data) Simulated landslide risk due to artificial heavy rainfall parameters. For platform testing only.',
    type: 'Landslide Warning', severity: 'medium', category: 'disaster',
    affectedStates: ['Kerala', 'Karnataka'],
    location: { type: 'Point', coordinates: [76.5200, 10.8505] }, // Western Ghats
    source: 'system', isActive: true, isVerified: true,
  },
  {
    title: '[SIMULATION] Dense Fog Alert',
    description: '(Mock Data) Simulated low visibility conditions for traffic warning systems test. Conditions are normal.',
    type: 'Fog Warning', severity: 'low', category: 'traffic',
    affectedStates: ['Punjab', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [76.7794, 30.7333] }, // Chandigarh
    source: 'system', isActive: true, isVerified: true,
  },
]

/**
 * GET /api/v1/alerts
 * Get paginated list of active alerts
 */
router.get('/', asyncWrapper(async (req, res) => {
  const page     = parseInt(req.query.page)     || 1
  const limit    = parseInt(req.query.limit)    || 10
  const severity = req.query.severity
  const category = req.query.category

  // Build filter
  const filter = { isActive: true }
  if (severity) filter.severity = severity
  if (category) filter.category = category

  let alerts = await Alert.find(filter)
    .sort({ severity: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  // Fall back to live GDACS API if DB is empty
  if (alerts.length === 0) {
    const liveAlerts = await fetchLiveGDACSAlerts()
    
    if (liveAlerts && liveAlerts.length > 0) {
      alerts = liveAlerts.map((a, i) => ({
        ...a,
        _id: `live_${i}`
      }))
    } else {
      // Final fallback to mock alerts if no live feeds are available
      alerts = MOCK_ALERTS.map((a, i) => ({
        ...a,
        _id: `mock_${i}`,
        createdAt: new Date(Date.now() - i * 3600000),
        updatedAt: new Date(),
      }))
    }
  }

  return ApiResponse.paginated(res, {
    data: alerts,
    total: alerts.length,
    page,
    limit,
    message: 'Alerts fetched successfully',
  })
}))

/**
 * GET /api/v1/alerts/:id
 * Get a single alert
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const alert = await Alert.findById(req.params.id)
  if (!alert) return ApiResponse.error(res, { message: 'Alert not found', statusCode: 404 })
  return ApiResponse.success(res, { data: { alert } })
}))

/**
 * POST /api/v1/alerts
 * Create alert (moderator/admin only)
 */
router.post('/', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const alert = await Alert.create({ ...req.body, createdBy: req.user._id })
  return ApiResponse.created(res, { message: 'Alert created', data: { alert } })
}))

/**
 * PUT /api/v1/alerts/:id
 * Update alert (moderator/admin only)
 */
router.put('/:id', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!alert) return ApiResponse.error(res, { message: 'Alert not found', statusCode: 404 })
  return ApiResponse.success(res, { message: 'Alert updated', data: { alert } })
}))

/**
 * DELETE /api/v1/alerts/:id
 * Soft delete alert (admin only)
 */
const { adminOnly } = require('../../middleware/rbac.middleware')
router.delete('/:id', protect, adminOnly, asyncWrapper(async (req, res) => {
  await Alert.findByIdAndUpdate(req.params.id, { isActive: false })
  return ApiResponse.success(res, { message: 'Alert deactivated' })
}))

module.exports = router
