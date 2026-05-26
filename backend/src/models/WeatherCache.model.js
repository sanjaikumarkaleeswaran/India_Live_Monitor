const mongoose = require('mongoose')

/**
 * WeatherCache — Caches external OpenWeather API responses
 * TTL: 30 minutes per city entry
 */
const WeatherCacheSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // TTL: 30 minutes (MongoDB auto-deletes)
    },
  },
  { timestamps: false },
)

WeatherCacheSchema.index({ city: 1 })

module.exports = mongoose.model('WeatherCache', WeatherCacheSchema)
