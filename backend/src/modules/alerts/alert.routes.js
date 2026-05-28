const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const Alert = require('../../models/Alert.model')

const router = express.Router()

// Seed alerts (realistic India-specific alerts)
const MOCK_ALERTS = [
  {
    title: 'Cyclone Mocha Warning — Bay of Bengal',
    description: 'A very severe cyclonic storm is likely to make landfall near Andhra Pradesh coast. High waves and strong winds expected. Coastal populations advised to evacuate.',
    type: 'Cyclone Warning', severity: 'critical', category: 'weather',
    affectedStates: ['Andhra Pradesh', 'Odisha', 'West Bengal'],
    location: { type: 'Point', coordinates: [83.2185, 15.9129] }, // AP coast
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Heatwave Alert — Rajasthan & Haryana',
    description: 'Maximum temperatures expected to remain 46–48°C for the next 3 days. Avoid outdoor exposure between 11am–4pm. Stay hydrated.',
    type: 'Heatwave Alert', severity: 'high', category: 'weather',
    affectedStates: ['Rajasthan', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [75.7873, 26.9124] }, // Jaipur
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Flood Warning — Brahmaputra River Basin',
    description: 'River water level is above danger mark at multiple gauging stations. Low-lying areas advised to move to higher ground. NDRF teams deployed.',
    type: 'Flood Warning', severity: 'high', category: 'disaster',
    affectedStates: ['Assam', 'Arunachal Pradesh'],
    location: { type: 'Point', coordinates: [93.6053, 26.1445] }, // Guwahati
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Air Quality Hazardous — Delhi NCR',
    description: 'AQI has crossed 400 in multiple Delhi monitoring stations. Outdoor activities strongly discouraged. Schools may be advised to close.',
    type: 'Air Quality Alert', severity: 'medium', category: 'health',
    affectedStates: ['Delhi', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // Delhi
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Heavy Rainfall Alert — Mumbai Suburban',
    description: 'IMD issues red alert for Mumbai Metropolitan Region. Expected rainfall: 150mm in 24 hours. Low-lying areas prone to waterlogging.',
    type: 'Rainfall Alert', severity: 'high', category: 'weather',
    affectedStates: ['Maharashtra'],
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Landslide Risk — Western Ghats',
    description: 'Continuous heavy rainfall has saturated soil in Kerala and Karnataka hill districts. Avoid travel through ghat sections. Stay on designated roads only.',
    type: 'Landslide Warning', severity: 'medium', category: 'disaster',
    affectedStates: ['Kerala', 'Karnataka'],
    location: { type: 'Point', coordinates: [76.5200, 10.8505] }, // Western Ghats
    source: 'official', isActive: true, isVerified: true,
  },
  {
    title: 'Dense Fog Alert — North India Highways',
    description: 'Visibility below 50m on NH-44, NH-48 in Punjab, Haryana, UP. Slow down and use fog lights. Highway patrol on alert.',
    type: 'Fog Warning', severity: 'low', category: 'traffic',
    affectedStates: ['Punjab', 'Haryana', 'Uttar Pradesh'],
    location: { type: 'Point', coordinates: [76.7794, 30.7333] }, // Chandigarh
    source: 'official', isActive: true, isVerified: true,
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

  // Fall back to mock alerts if DB is empty
  if (alerts.length === 0) {
    alerts = MOCK_ALERTS.map((a, i) => ({
      ...a,
      _id: `mock_${i}`,
      createdAt: new Date(Date.now() - i * 3600000),
      updatedAt: new Date(),
    }))
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
