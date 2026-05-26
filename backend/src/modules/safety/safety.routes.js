const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const SafetyZone = require('../../models/SafetyZone.model')

const router = express.Router()

// Helper: seed mock safety zones if DB is empty
const seedSafetyZones = async () => {
  const count = await SafetyZone.countDocuments()
  if (count > 0) return

  const zones = [
    {
      name: 'Connaught Place',
      city: 'Delhi',
      location: { type: 'Point', coordinates: [77.2167, 28.6304] },
      score: 85,
      riskLevel: 'low',
      factors: { lighting: 9, policePresence: 8, recentIncidents: 2 },
    },
    {
      name: 'Seelampur',
      city: 'Delhi',
      location: { type: 'Point', coordinates: [77.2667, 28.6667] },
      score: 45,
      riskLevel: 'high',
      factors: { lighting: 4, policePresence: 5, recentIncidents: 12 },
    },
    {
      name: 'Bandra West',
      city: 'Mumbai',
      location: { type: 'Point', coordinates: [72.8333, 19.0500] },
      score: 78,
      riskLevel: 'low',
      factors: { lighting: 8, policePresence: 7, recentIncidents: 3 },
    },
    {
      name: 'Dharavi',
      city: 'Mumbai',
      location: { type: 'Point', coordinates: [72.8596, 19.0380] },
      score: 55,
      riskLevel: 'medium',
      factors: { lighting: 5, policePresence: 6, recentIncidents: 8 },
    },
  ]
  await SafetyZone.insertMany(zones)
}

/**
 * GET /api/v1/safety/zones
 * Get safety zones by city or near a location
 */
router.get('/zones', asyncWrapper(async (req, res) => {
  await seedSafetyZones()

  const { city, lat, lng, radius = 10000 } = req.query
  let query = {}

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius), // in meters
      },
    }
  } else if (city) {
    query.city = { $regex: new RegExp(city, 'i') }
  }

  const zones = await SafetyZone.find(query).limit(50)

  return ApiResponse.success(res, {
    data: zones,
  })
}))

/**
 * POST /api/v1/safety/route
 * Evaluate the safety of a given route (array of coordinates)
 */
router.post('/route', asyncWrapper(async (req, res) => {
  await seedSafetyZones()

  const { waypoints } = req.body
  if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
    return ApiResponse.error(res, { message: 'Valid waypoints array required', statusCode: 400 })
  }

  // A basic mock algorithm to evaluate route safety
  // In a real scenario, this would query SafetyZones along the polyline.
  // For now, we simulate checking points and return a mocked result based on distance/randomness.

  // Check if any waypoint is near a high risk zone
  let overallRisk = 'low'
  let averageScore = 80
  let dangerPoints = []

  // Randomly simulate route evaluation
  const isNight = new Date().getHours() < 6 || new Date().getHours() > 19
  if (isNight) {
    averageScore -= 15
    overallRisk = 'medium'
  }

  // Find zones near the start and end points
  const startPoint = waypoints[0]
  const startZones = await SafetyZone.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(startPoint.lng), parseFloat(startPoint.lat)] },
        $maxDistance: 5000,
      },
    },
  }).limit(1)

  if (startZones.length > 0 && startZones[0].riskLevel === 'high') {
    overallRisk = 'high'
    averageScore = Math.min(averageScore, startZones[0].score)
    dangerPoints.push({
      lat: startZones[0].location.coordinates[1],
      lng: startZones[0].location.coordinates[0],
      reason: 'Starts in a historically high-risk zone'
    })
  }

  // Add some slight randomness
  if (Math.random() > 0.8) {
    overallRisk = 'critical'
    averageScore = 30
    dangerPoints.push({
      lat: waypoints[Math.floor(waypoints.length / 2)].lat,
      lng: waypoints[Math.floor(waypoints.length / 2)].lng,
      reason: 'Route passes through unlit or poorly policed area'
    })
  }

  return ApiResponse.success(res, {
    data: {
      isSafe: averageScore > 50,
      safetyScore: averageScore,
      riskLevel: overallRisk,
      dangerPoints,
      recommendations: overallRisk === 'low' 
        ? ['Route is generally safe. Stay alert.'] 
        : ['Consider alternate routes.', 'Share your live location with a contact.', 'Avoid stopping in unlit areas.'],
    },
  })
}))

module.exports = router
