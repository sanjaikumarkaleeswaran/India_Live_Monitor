const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const SOS = require('../../models/SOS.model')

const router = express.Router()

// National emergency contacts (always available, no auth required)
const EMERGENCY_CONTACTS = [
  { name: 'National Emergency', number: '112', category: 'emergency', icon: 'phone', color: '#f97316', priority: 1 },
  { name: 'Police',             number: '100', category: 'police',    icon: 'shield', color: '#3b82f6', priority: 2 },
  { name: 'Fire Services',      number: '101', category: 'fire',      icon: 'flame',  color: '#ef4444', priority: 3 },
  { name: 'Ambulance',          number: '102', category: 'medical',   icon: 'activity', color: '#10b981', priority: 4 },
  { name: 'Disaster Management (NDMA)', number: '1078', category: 'disaster', icon: 'alert', color: '#f59e0b', priority: 5 },
  { name: 'Women Helpline',     number: '1091', category: 'safety',  icon: 'heart',  color: '#ec4899', priority: 6 },
  { name: 'Child Helpline (Childline)', number: '1098', category: 'child', icon: 'users', color: '#8b5cf6', priority: 7 },
  { name: 'Railway Helpline',   number: '139',  category: 'transport', icon: 'train', color: '#6366f1', priority: 8 },
  { name: 'Road Accident Emergency', number: '1073', category: 'transport', icon: 'car', color: '#f59e0b', priority: 9 },
  { name: 'Senior Citizen Helpline', number: '14567', category: 'elderly', icon: 'user', color: '#6366f1', priority: 10 },
  { name: 'COVID-19 Helpline', number: '1075', category: 'health', icon: 'activity', color: '#10b981', priority: 11 },
  { name: 'Cyber Crime',       number: '1930', category: 'cyber',  icon: 'shield', color: '#8b5cf6', priority: 12 },
]

/**
 * GET /api/v1/emergency/contacts
 * Get all national emergency contacts
 */
router.get('/contacts', asyncWrapper(async (req, res) => {
  const { category } = req.query
  let contacts = EMERGENCY_CONTACTS
  if (category) contacts = contacts.filter((c) => c.category === category)

  return ApiResponse.success(res, {
    data: { contacts, total: contacts.length },
    message: 'Emergency contacts fetched successfully',
  })
}))

/**
 * GET /api/v1/emergency/hospitals/nearby
 * Get hospitals near a coordinate
 * Query: lat, lng, radius (km, default 10)
 */
router.get('/hospitals/nearby', asyncWrapper(async (req, res) => {
  const { lat, lng, radius = 10 } = req.query

  // Mock nearby hospitals (replace with MongoDB $near query + real data in Phase 5)
  const hospitals = [
    { name: 'AIIMS New Delhi',           type: 'Government', phone: '011-26588500', distance: 2.3, beds: { total: 2400, available: 127 } },
    { name: 'Apollo Hospital',           type: 'Private',    phone: '1860-500-1066', distance: 3.8, beds: { total: 800,  available: 45  } },
    { name: 'Safdarjung Hospital',       type: 'Government', phone: '011-26707444', distance: 4.1, beds: { total: 1800, available: 89  } },
    { name: 'Max Super Specialty',       type: 'Private',    phone: '011-26515050', distance: 5.2, beds: { total: 600,  available: 22  } },
    { name: 'Ram Manohar Lohia Hospital',type: 'Government', phone: '011-23404482', distance: 6.7, beds: { total: 1500, available: 64  } },
  ]

  return ApiResponse.success(res, {
    data: { hospitals, userLocation: { lat, lng }, radius },
    message: `Found ${hospitals.length} hospitals within ${radius}km`,
  })
}))

/**
 * GET /api/v1/emergency/police/nearby
 * Get police stations near a coordinate
 */
router.get('/police/nearby', asyncWrapper(async (req, res) => {
  const { lat, lng, radius = 5 } = req.query

  const stations = [
    { name: 'Connaught Place Police Station', phone: '011-23741350', distance: 1.2 },
    { name: 'Parliament Street Police Station', phone: '011-23741356', distance: 2.4 },
    { name: 'Janpath Police Station',           phone: '011-23741360', distance: 3.1 },
  ]

  return ApiResponse.success(res, {
    data: { stations, userLocation: { lat, lng }, radius },
  })
}))

/**
 * POST /api/v1/emergency/sos
 * Record an SOS signal with user location
 */
router.post('/sos', protect, asyncWrapper(async (req, res) => {
  const { lat, lng, message } = req.body

  if (!lat || !lng) {
    return ApiResponse.error(res, { message: 'Latitude and longitude coordinates are required for SOS', statusCode: 400 })
  }

  // Save SOS to MongoDB
  const sos = await SOS.create({
    user: req.user._id,
    name: req.user.name,
    phone: req.user.phone || '',
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)] // [longitude, latitude]
    },
    message: message || 'Critical citizen SOS alert triggered from Smart India Dashboard',
    status: 'Pending'
  })

  // Format SOS details for the real-time websocket emit
  const sosData = {
    id: sos._id,
    name: sos.name,
    location: `${req.user.city || 'Unknown'} (${lat}, ${lng})`,
    phone: sos.phone || 'N/A',
    status: sos.status,
    time: 'Just now',
    createdAt: sos.createdAt
  }

  // Trigger Socket.io broadcast to administrators
  if (req.app.get('io')) {
    req.app.get('io').emit('emergency:sos', sosData)
  }

  return ApiResponse.success(res, {
    message: '🆘 SOS signal received. Emergency services and control centers have been notified via live sockets. Call 112 immediately.',
    data: {
      sosId: sos._id,
      receivedAt: sos.createdAt,
      location: { lat, lng },
      emergencyContacts: EMERGENCY_CONTACTS.slice(0, 4),
    },
  })
}))

/**
 * GET /api/v1/emergency/sos
 * Get all active/pending SOS requests (moderator/admin only)
 */
router.get('/sos', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const sosList = await SOS.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  const formattedSos = sosList.map(s => ({
    id: s._id,
    name: s.name,
    location: `(${s.location.coordinates[1]}, ${s.location.coordinates[0]})`,
    phone: s.phone || 'N/A',
    status: s.status,
    time: s.createdAt,
  }))

  return ApiResponse.success(res, {
    data: { sosRequests: formattedSos }
  })
}))

/**
 * PUT /api/v1/emergency/sos/:id/status
 * Update SOS dispatch status (moderator/admin only)
 */
router.put('/sos/:id/status', protect, moderatorOrAdmin, asyncWrapper(async (req, res) => {
  const { status } = req.body
  if (!['Pending', 'Dispatched', 'Resolved'].includes(status)) {
    return ApiResponse.error(res, { message: 'Invalid status', statusCode: 400 })
  }

  const sos = await SOS.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )

  if (!sos) {
    return ApiResponse.error(res, { message: 'SOS request not found', statusCode: 404 })
  }

  const updatedSos = {
    id: sos._id,
    status: sos.status
  }

  // Broadcast the update to admin panel in real-time
  if (req.app.get('io')) {
    req.app.get('io').emit('emergency:sos_updated', updatedSos)
  }

  return ApiResponse.success(res, {
    message: `SOS status updated to ${status}`,
    data: { sos: updatedSos }
  })
}))

module.exports = router
