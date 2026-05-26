const express = require('express')
const axios = require('axios')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const AQICache = require('../../models/AQICache.model')

const router = express.Router()

// Realistic mock AQI data for major Indian cities if API token is missing
const MOCK_AQI_DATA = {
  DELHI:     { aqi: 345, category: 'Very Poor',    pm25: 185, pm10: 270, o3: 35, no2: 48 },
  MUMBAI:    { aqi: 178, category: 'Moderate',     pm25: 75,  pm10: 125, o3: 28, no2: 24 },
  CHENNAI:   { aqi: 92,  category: 'Satisfactory', pm25: 35,  pm10: 55,  o3: 30, no2: 15 },
  KOLKATA:   { aqi: 212, category: 'Poor',         pm25: 92,  pm10: 130, o3: 25, no2: 34 },
  BENGALURU: { aqi: 114, category: 'Moderate',     pm25: 42,  pm10: 65,  o3: 35, no2: 18 },
  HYDERABAD: { aqi: 145, category: 'Moderate',     pm25: 55,  pm10: 85,  o3: 28, no2: 26 },
}

/**
 * GET /api/v1/aqi
 * Get AQI for a city
 * Query: city (default: Delhi)
 */
router.get('/', asyncWrapper(async (req, res) => {
  const city = (req.query.city || 'Delhi').toUpperCase()
  const token = process.env.AQICN_API_KEY

  if (!token || token.startsWith('your_')) {
    const mock = MOCK_AQI_DATA[city] || MOCK_AQI_DATA.DELHI
    return ApiResponse.success(res, {
      message: 'Fetched mock AQI data (API token missing/placeholder)',
      data: {
        city: city.charAt(0) + city.slice(1).toLowerCase(),
        ...mock,
        time: new Date(),
        source: 'mock',
      },
    })
  }

  try {
    // ── 1. Check MongoDB AQI cache first ───────────────────────
    const cached = await AQICache.findOne({ city })
    if (cached) {
      return ApiResponse.success(res, {
        message: 'AQI data from cache',
        data: { ...cached.data, source: 'cache' },
      })
    }

    const url = `https://api.waqi.info/feed/${city}/?token=${token}`
    const response = await axios.get(url)
    const result = response.data

    if (result.status !== 'ok') {
      throw new Error(result.data || 'AQICN API returned error status')
    }

    const { aqi, iaqi, time } = result.data
    
    // Categorize standard Indian AQI bands
    let category = 'Good'
    if (aqi > 50)  category = 'Satisfactory'
    if (aqi > 100) category = 'Moderate'
    if (aqi > 200) category = 'Poor'
    if (aqi > 300) category = 'Very Poor'
    if (aqi > 400) category = 'Severe'

    const aqiData = {
      city,
      aqi,
      category,
      pm25: iaqi.pm25?.v || null,
      pm10: iaqi.pm10?.v || null,
      o3:   iaqi.o3?.v   || null,
      no2:  iaqi.no2?.v  || null,
      time: time.s,
      source: 'aqicn',
    }

    // Save to AQI cache (upsert)
    await AQICache.findOneAndUpdate(
      { city },
      { data: aqiData, fetchedAt: new Date() },
      { upsert: true, new: true }
    )

    return ApiResponse.success(res, {
      message: 'AQI data fetched successfully',
      data: aqiData,
    })
  } catch (error) {
    const mock = MOCK_AQI_DATA[city] || MOCK_AQI_DATA.DELHI
    return ApiResponse.success(res, {
      message: 'AQI API error, returned fallback mock data',
      data: {
        city,
        ...mock,
        time: new Date(),
        source: 'fallback',
      },
    })
  }
}))

module.exports = router
