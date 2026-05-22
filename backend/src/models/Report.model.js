const mongoose = require('mongoose')

/**
 * Report — Citizen reported civic incidents
 * Supports: Road Damage, Flooding, Utility, Accident, Fire Hazard, Other
 */
const ReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['Road Damage', 'Flooding', 'Utility', 'Accident', 'Fire Hazard', 'Other'],
      required: [true, 'Category is required'],
    },
    locationName: {
      type: String,
      required: [true, 'Location name/details are required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [78.9629, 20.5937], // Default India center
      },
    },
    verifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    flaggedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Under Review', 'Resolved'],
      default: 'Active',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ReportSchema.index({ location: '2dsphere' })
ReportSchema.index({ category: 1 })
ReportSchema.index({ status: 1 })
ReportSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Report', ReportSchema)
