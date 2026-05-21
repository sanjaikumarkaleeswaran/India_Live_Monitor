const express = require('express')
const axios = require('axios')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')

const router = express.Router()

// Realistic mock weather data for major Indian cities if API key is missing
const MOCK_WEATHER_DATA = {
  DELHI:     { temp: 39.5, feelsLike: 43.1, humidity: 41, windSpeed: 12.5, condition: 'Clear Sky', icon: '☀️' },
  MUMBAI:    { temp: 31.2, feelsLike: 36.8, humidity: 78, windSpeed: 16.2, condition: 'Humid/Cloudy', icon: '⛅' },
  CHENNAI:   { temp: 34.0, feelsLike: 40.5, humidity: 72, windSpeed: 18.0, condition: 'Partly Cloudy', icon: '⛅' },
  KOLKATA:   { temp: 33.4, feelsLike: 39.0, humidity: 82, windSpeed: 14.5, condition: 'Scattered Clouds', icon: '☁️' },
  BENGALURU: { temp: 27.8, feelsLike: 29.5, humidity: 55, windSpeed: 21.0, condition: 'Breezy/Pleasant', icon: '🍃' },
  HYDERABAD: { temp: 33.2, feelsLike: 35.5, humidity: 49, windSpeed: 13.0, condition: 'Clear Sky', icon: '☀️' },
}

/**
 * GET /api/v1/weather
 * Get current weather for a city
 * Query: city (default: Delhi)
 */
router.get('/', asyncWrapper(async (req, res) => {
  const city = (req.query.city || 'Delhi').toUpperCase()
  const apiKey = process.env.OPENWEATHER_API_KEY

  // If no API key is provided, use mock data
  if (!apiKey || apiKey.startsWith('your_')) {
    const mock = MOCK_WEATHER_DATA[city] || MOCK_WEATHER_DATA.DELHI
    return ApiResponse.success(res, {
      message: 'Fetched mock weather data (API Key missing/placeholder)',
      data: {
        city: city.charAt(0) + city.slice(1).toLowerCase(),
        ...mock,
        forecast: [
          { day: 'Fri', temp: Math.round(mock.temp + 1), condition: mock.condition },
          { day: 'Sat', temp: Math.round(mock.temp), condition: mock.condition },
          { day: 'Sun', temp: Math.round(mock.temp - 2), condition: 'Thunderstorm' },
        ],
        source: 'mock',
      },
    })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&units=metric&appid=${apiKey}`
    const response = await axios.get(url)
    const { main, weather, wind, name } = response.data

    return ApiResponse.success(res, {
      message: 'Weather data fetched successfully',
      data: {
        city: name,
        temp: main.temp,
        feelsLike: main.feels_like,
        humidity: main.humidity,
        windSpeed: wind.speed,
        condition: weather[0].description,
        icon: weather[0].icon,
        source: 'openweathermap',
      },
    })
  } catch (error) {
    // Fallback if OpenWeather errors out
    const mock = MOCK_WEATHER_DATA[city] || MOCK_WEATHER_DATA.DELHI
    return ApiResponse.success(res, {
      message: 'Weather API error, returned fallback mock data',
      data: {
        city,
        ...mock,
        forecast: [],
        source: 'fallback',
      },
    })
  }
}))

module.exports = router
