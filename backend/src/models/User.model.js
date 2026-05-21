const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
      sparse: true, // Allows null but enforces uniqueness when set
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },

    // ── Profile ────────────────────────────────────────────
    avatar: { type: String, default: null },
    state: { type: String, default: null },  // Preferred state for alerts
    city:  { type: String, default: null },

    // ── GIS: User's saved location ─────────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],  // [longitude, latitude]
        default: [80.2707, 13.0827], // Default: Chennai
      },
    },

    // ── Preferences ────────────────────────────────────────
    preferences: {
      alertNotifications: { type: Boolean, default: true },
      fuelAlerts:         { type: Boolean, default: true },
      weatherAlerts:      { type: Boolean, default: true },
      aqiAlerts:          { type: Boolean, default: true },
      disasterAlerts:     { type: Boolean, default: true },
      language:           { type: String, enum: ['en', 'hi', 'ta', 'te', 'kn', 'bn'], default: 'en' },
      theme:              { type: String, enum: ['dark', 'light'], default: 'dark' },
    },

    // ── Auth tokens ────────────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerifyToken:     { type: String, select: false },

    // ── Status ─────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
    lastLogin:       { type: Date, default: null },
  },
  {
    timestamps: true,  // Adds createdAt, updatedAt
    toJSON: {
      transform: (doc, ret) => {
        // Remove sensitive fields from JSON output
        delete ret.password
        delete ret.refreshToken
        delete ret.passwordResetToken
        delete ret.emailVerifyToken
        return ret
      },
    },
  },
)

// ── Indexes ────────────────────────────────────────────────
UserSchema.index({ location: '2dsphere' })            // Geospatial queries
UserSchema.index({ role: 1 })                         // Role-based filtering
UserSchema.index({ createdAt: -1 })                   // Latest users first

// ── Pre-save: Hash password ────────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Instance Method: Compare password ─────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// ── Instance Method: Get public profile ───────────────────
UserSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    state: this.state,
    city: this.city,
    preferences: this.preferences,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  }
}

module.exports = mongoose.model('User', UserSchema)
