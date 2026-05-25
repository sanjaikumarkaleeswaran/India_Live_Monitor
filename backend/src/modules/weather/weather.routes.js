const express = require('express')
const axios = require('axios')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')

const router = express.Router()

// Realistic mock weather data for major Indian cities if API key is missing
const MOCK_WEATHER_DATA = {
  DELHI:     { temp: 46.2, feelsLike: 49.1, humidity: 32, windSpeed: 15.5, condition: 'Severe Heatwave', icon: '☀️' },
  MUMBAI:    { temp: 35.8, feelsLike: 44.2, humidity: 82, windSpeed: 18.2, condition: 'Humid', icon: '⛅' },
  CHENNAI:   { temp: 39.0, feelsLike: 45.5, humidity: 75, windSpeed: 20.0, condition: 'Hot & Humid', icon: '⛅' },
  KOLKATA:   { temp: 38.4, feelsLike: 43.0, humidity: 85, windSpeed: 16.5, condition: 'Scattered Clouds', icon: '☁️' },
  BENGALURU: { temp: 32.8, feelsLike: 34.5, humidity: 45, windSpeed: 22.0, condition: 'Partly Cloudy', icon: '⛅' },
  HYDERABAD: { temp: 41.2, feelsLike: 43.5, humidity: 40, windSpeed: 14.0, condition: 'Clear Sky', icon: '☀️' },
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
          { day: 'Mon', temp: Math.round(mock.temp), condition: mock.condition },
          { day: 'Tue', temp: Math.round(mock.temp + 1), condition: mock.condition },
          { day: 'Wed', temp: Math.round(mock.temp - 1), condition: 'Cloudy' },
          { day: 'Thu', temp: Math.round(mock.temp), condition: mock.condition },
          { day: 'Fri', temp: Math.round(mock.temp + 2), condition: 'Severe Heatwave' },
          { day: 'Sat', temp: Math.round(mock.temp - 2), condition: 'Thunderstorm' },
          { day: 'Sun', temp: Math.round(mock.temp - 3), condition: 'Light Rain' },
        ],
        hourlyForecast: [
          { time: '08:00', temp: Math.round(mock.temp - 5) },
          { time: '11:00', temp: Math.round(mock.temp - 2) },
          { time: '14:00', temp: Math.round(mock.temp) },
          { time: '17:00', temp: Math.round(mock.temp + 1) },
          { time: '20:00', temp: Math.round(mock.temp - 3) },
          { time: '23:00', temp: Math.round(mock.temp - 6) },
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
