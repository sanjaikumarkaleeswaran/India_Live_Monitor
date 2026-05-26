const express = require('express')
const axios = require('axios')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const WeatherCache = require('../../models/WeatherCache.model')

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
    // ── 1. Check MongoDB cache first ──────────────────────────
    const cached = await WeatherCache.findOne({ city })
    if (cached) {
      return ApiResponse.success(res, {
        message: 'Weather data from cache',
        data: { ...cached.data, source: 'cache' },
      })
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&units=metric&appid=${apiKey}`
    const response = await axios.get(url)
    const { main, weather, wind, name } = response.data

    const weatherData = {
      city: name,
      temp: main.temp,
      feelsLike: main.feels_like,
      humidity: main.humidity,
      windSpeed: Math.round(wind.speed * 3.6),
      condition: weather[0].description,
      icon: weather[0].icon,
      source: 'openweathermap',
    }

    // Save to cache (upsert)
    await WeatherCache.findOneAndUpdate(
      { city },
      { data: weatherData, fetchedAt: new Date() },
      { upsert: true, new: true }
    )

    return ApiResponse.success(res, { message: 'Weather data fetched successfully', data: weatherData })
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

/**
 * GET /api/v1/weather/forecast
 * Get 5-day / 3-hour forecast for a city (OpenWeather)
 */
router.get('/forecast', asyncWrapper(async (req, res) => {
  const city = (req.query.city || 'Delhi').toUpperCase()
  const apiKey = process.env.OPENWEATHER_API_KEY

  const generateMockForecast = (baseTemp) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const conditions = ['Clear', 'Partly Cloudy', 'Thunderstorm', 'Haze', 'Light Rain']
    const forecast = days.map((day, i) => ({
      day,
      date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      temp: Math.round(baseTemp + (Math.random() * 4 - 2)),
      tempMin: Math.round(baseTemp - 4 + (Math.random() * 2)),
      tempMax: Math.round(baseTemp + 3 + (Math.random() * 2)),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(10 + Math.random() * 20),
      icon: '01d',
    }))

    const hourlyForecast = Array.from({ length: 8 }).map((_, i) => ({
      time: new Date(Date.now() + i * 10800000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(baseTemp + (Math.random() * 4 - 2)),
    }))

    return { forecast, hourlyForecast }
  }

  if (!apiKey || apiKey.startsWith('your_')) {
    const mock = MOCK_WEATHER_DATA[city] || MOCK_WEATHER_DATA.DELHI
    const mockData = generateMockForecast(mock.temp)
    return ApiResponse.success(res, {
      data: { city, forecast: mockData.forecast, hourlyForecast: mockData.hourlyForecast, source: 'mock' }
    })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&units=metric&cnt=40&appid=${apiKey}`
    const response = await axios.get(url)
    const list = response.data.list

    // Group by day (pick noon reading per day)
    const dayMap = {}
    list.forEach(entry => {
      const date = new Date(entry.dt * 1000)
      const dayKey = date.toLocaleDateString('en-IN', { weekday: 'short' })
      const hour = date.getHours()
      if (!dayMap[dayKey] || Math.abs(hour - 12) < Math.abs(new Date(dayMap[dayKey].dt * 1000).getHours() - 12)) {
        dayMap[dayKey] = entry
      }
    })

    const forecast = Object.entries(dayMap).slice(0, 7).map(([day, entry]) => ({
      day,
      date: new Date(entry.dt * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      temp: Math.round(entry.main.temp),
      tempMin: Math.round(entry.main.temp_min),
      tempMax: Math.round(entry.main.temp_max),
      condition: entry.weather[0].description,
      humidity: entry.main.humidity,
      windSpeed: Math.round(entry.wind.speed * 3.6), // m/s to km/h
      icon: entry.weather[0].icon,
    }))

    // Extract first 8 items for 24-hour hourly trend
    const hourlyForecast = list.slice(0, 8).map(entry => ({
      time: new Date(entry.dt * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(entry.main.temp),
      icon: entry.weather[0].icon,
    }))

    return ApiResponse.success(res, { data: { city, forecast, hourlyForecast, source: 'openweathermap' } })
  } catch (error) {
    const mock = MOCK_WEATHER_DATA[city] || MOCK_WEATHER_DATA.DELHI
    return ApiResponse.success(res, {
      data: { city, forecast: generateMockForecast(mock.temp), source: 'fallback' }
    })
  }
}))

module.exports = router
