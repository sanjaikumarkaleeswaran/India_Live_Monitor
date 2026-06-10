const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const { protect } = require('../../middleware/auth.middleware')
const { moderatorOrAdmin } = require('../../middleware/rbac.middleware')
const ApiResponse = require('../../utils/apiResponse')
const SOS = require('../../models/SOS.model')
const Hospital = require('../../models/Hospital.model')
const PoliceStation = require('../../models/PoliceStation.model')
const validate = require('../../middleware/validate.middleware')
const { submitSOSSchema } = require('./emergency.validation')
const { updateSOSStatusSchema } = require('../admin/admin.validation')

// Helper function to seed initial emergency centers if DB is empty
const seedEmergencyData = async () => {
  const hospitalCount = await Hospital.countDocuments()
  if (hospitalCount === 0) {
    const SEED_HOSPITALS = [
      { name: 'AIIMS New Delhi',           type: 'Government', phone: '011-26588500', beds: { total: 2400, available: 127 }, location: { type: 'Point', coordinates: [77.2100, 28.5672] } },
      { name: 'Apollo Hospital',           type: 'Private',    phone: '1860-500-1066', beds: { total: 800,  available: 45  }, location: { type: 'Point', coordinates: [77.2882, 28.5367] } },
      { name: 'Safdarjung Hospital',       type: 'Government', phone: '011-26707444', beds: { total: 1800, available: 89  }, location: { type: 'Point', coordinates: [77.2079, 28.5679] } },
      { name: 'Max Super Specialty',       type: 'Private',    phone: '011-26515050', beds: { total: 600,  available: 22  }, location: { type: 'Point', coordinates: [77.2201, 28.5283] } },
      { name: 'Ram Manohar Lohia Hospital',type: 'Government', phone: '011-23404482', beds: { total: 1500, available: 64  }, location: { type: 'Point', coordinates: [77.2016, 28.6253] } },
      { name: 'Mumbai General Hospital',   type: 'Government', phone: '022-22621415', beds: { total: 1000, available: 110 }, location: { type: 'Point', coordinates: [72.8348, 18.9401] } },
      { name: 'Chennai Rajiv Gandhi Govt Hospital', type: 'Government', phone: '044-25305000', beds: { total: 1200, available: 75 }, location: { type: 'Point', coordinates: [80.2748, 13.0818] } },
      { name: 'Kolkata Medical College',   type: 'Government', phone: '033-22414901', beds: { total: 1100, available: 95 }, location: { type: 'Point', coordinates: [88.3639, 22.5726] } },
      { name: 'Bengaluru Victoria Hospital', type: 'Government', phone: '080-26701150', beds: { total: 950, available: 50 }, location: { type: 'Point', coordinates: [77.5739, 12.9632] } }
    ]
    await Hospital.insertMany(SEED_HOSPITALS)
  }

  const policeCount = await PoliceStation.countDocuments()
  if (policeCount === 0) {
    const SEED_POLICE_STATIONS = [
      { name: 'Connaught Place Police Station', phone: '011-23741350', location: { type: 'Point', coordinates: [77.2183, 28.6304] } },
      { name: 'Parliament Street Police Station', phone: '011-23741356', location: { type: 'Point', coordinates: [77.2120, 28.6240] } },
      { name: 'Janpath Police Station',           phone: '011-23741360', location: { type: 'Point', coordinates: [77.2180, 28.6200] } },
      { name: 'Delhi Police HQ',                  phone: '100',          location: { type: 'Point', coordinates: [77.2185, 28.6295] } },
      { name: 'Mumbai Police HQ',                 phone: '100',          location: { type: 'Point', coordinates: [72.8361, 18.9324] } }
    ]
    await PoliceStation.insertMany(SEED_POLICE_STATIONS)
  }
}

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
  const lat = parseFloat(req.query.lat) || 28.5672
  const lng = parseFloat(req.query.lng) || 77.2100
  const radius = parseFloat(req.query.radius) || 10

  await seedEmergencyData()

  // Execute $geoNear query using MongoDB aggregation
  const hospitals = await Hospital.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat] // [longitude, latitude]
        },
        distanceField: 'distance', // calculated distance field in meters
        maxDistance: radius * 1000, // max distance in meters
        spherical: true
      }
    }
  ])

  // Format response matching the expected frontend schema
  const formattedHospitals = hospitals.map(h => ({
    name: h.name,
    type: h.type,
    phone: h.phone,
    distance: parseFloat((h.distance / 1000).toFixed(1)), // convert meters to km with 1 decimal place
    beds: h.beds,
    lat: h.location.coordinates[1],
    lng: h.location.coordinates[0]
  }))

  return ApiResponse.success(res, {
    data: { hospitals: formattedHospitals, userLocation: { lat, lng }, radius },
    message: `Found ${formattedHospitals.length} hospitals within ${radius}km`,
  })
}))

/**
 * GET /api/v1/emergency/police/nearby
 * Get police stations near a coordinate
 */
router.get('/police/nearby', asyncWrapper(async (req, res) => {
  const lat = parseFloat(req.query.lat) || 28.5672
  const lng = parseFloat(req.query.lng) || 77.2100
  const radius = parseFloat(req.query.radius) || 5

  await seedEmergencyData()

  const stations = await PoliceStation.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat] // [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: radius * 1000,
        spherical: true
      }
    }
  ])

  const formattedStations = stations.map(s => ({
    name: s.name,
    phone: s.phone,
    distance: parseFloat((s.distance / 1000).toFixed(1)),
    lat: s.location.coordinates[1],
    lng: s.location.coordinates[0]
  }))

  return ApiResponse.success(res, {
    data: { stations: formattedStations, userLocation: { lat, lng }, radius },
    message: `Found ${formattedStations.length} police stations within ${radius}km`,
  })
}))

/**
 * POST /api/v1/emergency/sos
 * Record an SOS signal with user location
 */
router.post('/sos', protect, validate(submitSOSSchema), asyncWrapper(async (req, res) => {
  const { lat, lng, message } = req.body

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
 * POST /api/v1/emergency/sms-webhook
 * Receive offline SOS from Twilio SMS/WhatsApp gateway
 */
router.post('/sms-webhook', asyncWrapper(async (req, res) => {
  const { From, Body } = req.body
  const User = require('../../models/User.model')
  
  // Try to find user by phone number
  let phoneStr = From || ''
  if (phoneStr.startsWith('+91')) phoneStr = phoneStr.replace('+91', '')
  
  const user = await User.findOne({ phone: phoneStr })
  
  const sos = await SOS.create({
    user: user ? user._id : null,
    name: user ? user.name : 'Unknown Citizen (SMS Fallback)',
    phone: From || 'Unknown',
    location: user ? user.location : { type: 'Point', coordinates: [78.9629, 20.5937] },
    message: Body || 'Offline SMS SOS Triggered via Twilio',
    status: 'Pending'
  })

  const sosData = {
    id: sos._id,
    name: sos.name,
    location: user ? `${user.city || 'Unknown'} (${sos.location.coordinates[1]}, ${sos.location.coordinates[0]})` : 'Unknown (via SMS)',
    phone: sos.phone,
    status: sos.status,
    time: 'Just now',
    createdAt: sos.createdAt
  }

  // Trigger Socket.io broadcast to administrators
  if (req.app.get('io')) {
    req.app.get('io').emit('emergency:sos', sosData)
  }

  // Twilio requires TwiML XML response
  res.set('Content-Type', 'text/xml')
  res.send(`
    <Response>
      <Message>SILM: Your SOS has been received. Responders have been notified.</Message>
    </Response>
  `)
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
router.put('/sos/:id/status', protect, moderatorOrAdmin, validate(updateSOSStatusSchema), asyncWrapper(async (req, res) => {
  const { status } = req.body

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
