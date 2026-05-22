const mongoose = require('mongoose')

/**
 * SOS — Citizen emergency signals
 * Stores user coordinate location and dispatch state
 */
const SOSSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allow guest/anonymous SOS
    },
    name: {
      type: String,
      default: 'Anonymous Citizen',
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
        required: [true, 'SOS coordinates are required'],
      },
    },
    message: {
      type: String,
      default: 'Critical citizen SOS alert triggered from Smart India Dashboard',
    },
    status: {
      type: String,
      enum: ['Pending', 'Dispatched', 'Resolved'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
)

// Index for geoqueries
SOSSchema.index({ location: '2dsphere' })
SOSSchema.index({ status: 1 })
SOSSchema.index({ createdAt: -1 })

module.exports = mongoose.model('SOS', SOSSchema)
