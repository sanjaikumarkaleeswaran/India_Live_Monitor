const mongoose = require('mongoose')

/**
 * PoliceStation Schema
 * Stores police station information with GIS coordinates
 */
const PoliceStationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Police station name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
      },
    },
  },
  {
    timestamps: true,
  }
)

// Index for 2dsphere queries
PoliceStationSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('PoliceStation', PoliceStationSchema)
