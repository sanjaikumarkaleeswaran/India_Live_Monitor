const mongoose = require('mongoose')

/**
 * Hospital Schema
 * Stores hospital facility information with GIS coordinates
 */
const HospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Government', 'Private'],
      default: 'Government',
    },
    phone: {
      type: String,
      default: '',
    },
    beds: {
      total: {
        type: Number,
        default: 0,
      },
      available: {
        type: Number,
        default: 0,
      },
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
HospitalSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Hospital', HospitalSchema)
