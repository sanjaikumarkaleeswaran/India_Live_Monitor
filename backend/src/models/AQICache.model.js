const mongoose = require('mongoose')

/**
 * AQICache — Caches external AQICN API responses
 * TTL: 60 minutes per city entry
 */
const AQICacheSchema = new mongoose.Schema(
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
      expires: 3600, // TTL: 60 minutes (MongoDB auto-deletes)
    },
  },
  { timestamps: false },
)

AQICacheSchema.index({ city: 1 })

module.exports = mongoose.model('AQICache', AQICacheSchema)
