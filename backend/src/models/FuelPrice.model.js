const mongoose = require('mongoose')

/**
 * FuelPrice — Daily fuel prices per state/city
 * Indexed for fast state + date queries
 */
const FuelPriceSchema = new mongoose.Schema(
  {
    stateCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    stateName: {
      type: String,
      required: true,
      trim: true,
    },
    city: { type: String, trim: true, default: null },

    petrol: {
      price:         { type: Number, required: true },
      change:        { type: Number, default: 0 },     // Today's change vs yesterday
      changePercent: { type: Number, default: 0 },
    },
    diesel: {
      price:         { type: Number, required: true },
      change:        { type: Number, default: 0 },
      changePercent: { type: Number, default: 0 },
    },
    cng: {
      price:         { type: Number, default: null },
      change:        { type: Number, default: 0 },
    },

    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    source: {
      type: String,
      enum: ['iocl', 'bpcl', 'hpcl', 'scraper', 'manual'],
      default: 'manual',
    },
  },
  { timestamps: true },
)

// ── Indexes ────────────────────────────────────────────────
FuelPriceSchema.index({ stateCode: 1, effectiveDate: -1 })
FuelPriceSchema.index({ effectiveDate: -1 })

module.exports = mongoose.model('FuelPrice', FuelPriceSchema)
