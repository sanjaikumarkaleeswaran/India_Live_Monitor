const mongoose = require('mongoose')

/**
 * SafetyZone Schema
 * Stores safety scores and risk levels for different geographical zones
 */
const SafetyZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // 0 = very dangerous, 100 = very safe
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    factors: {
      lighting: { type: Number, min: 0, max: 10, default: 5 }, // 10 = well lit
      policePresence: { type: Number, min: 0, max: 10, default: 5 },
      recentIncidents: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

// Index for geospatial queries
SafetyZoneSchema.index({ location: '2dsphere' })
// Index for fast city lookups
SafetyZoneSchema.index({ city: 1 })

module.exports = mongoose.model('SafetyZone', SafetyZoneSchema)
