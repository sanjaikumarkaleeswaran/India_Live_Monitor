const mongoose = require('mongoose')

/**
 * Alert — National/regional civic alerts
 * Supports: weather, fuel, crime, disaster, health, utility, traffic
 */
const AlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Alert description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: [true, 'Severity level is required'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['weather', 'fuel', 'crime', 'disaster', 'health', 'utility', 'traffic', 'other'],
      required: [true, 'Category is required'],
    },

    // ── Geographic Coverage ────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point', 'Polygon'],
        default: 'Point',
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed, // Array of numbers OR array of arrays
        default: null,
      },
    },
    affectedStates:    [{ type: String }],
    affectedDistricts: [{ type: String }],
    affectedCities:    [{ type: String }],

    // ── Status ─────────────────────────────────────────────
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Source ─────────────────────────────────────────────
    source: {
      type: String,
      enum: ['official', 'crowdsourced', 'ai', 'system'],
      default: 'system',
    },
    sourceUrl: { type: String, default: null },

    // ── Created by ─────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Expiry ─────────────────────────────────────────────
    expiresAt: { type: Date, default: null },

    // ── Meta ───────────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  },
)

// ── Indexes ────────────────────────────────────────────────
AlertSchema.index({ location: '2dsphere' })       // Geospatial query support
AlertSchema.index({ severity: 1, isActive: 1 })  // Filter by severity + active
AlertSchema.index({ category: 1 })
AlertSchema.index({ createdAt: -1 })
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL auto-delete

module.exports = mongoose.model('Alert', AlertSchema)
