/**
 * seedAdmin.js
 * ------------
 * Ensures a single admin user exists in the database.
 *
 * Usage:
 *   node src/scripts/seedAdmin.js            → Creates admin if none exists
 *   node src/scripts/seedAdmin.js --reset    → Resets the existing admin's password to Admin@123
 *
 * Admin credentials (dev):
 *   Email:    (existing admin email)
 *   Password: Admin@123
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const RESET_MODE     = process.argv.includes('--reset')
const ADMIN_EMAIL    = 'admin@silm.in'
const ADMIN_PASSWORD = 'Admin@123'
const ADMIN_NAME     = 'SILM Admin'

// ── Connect ──────────────────────────────────────────────────────────────────
async function connect () {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI not set in .env')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅  MongoDB connected')
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seedAdmin () {
  await connect()
  const User = require('../models/User.model')

  const existing = await User.findOne({ role: 'admin' }).select('+password')

  // ── RESET MODE: update password of existing admin ────────────────────────
  if (RESET_MODE) {
    if (!existing) {
      console.log('⚠️   No admin found to reset. Run without --reset to create one.')
      await mongoose.disconnect()
      return
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)
    existing.password = hashedPassword
    await existing.save({ validateBeforeSave: false })

    console.log('🔑  Admin password reset successfully!')
    console.log('────────────────────────────────────')
    console.log(`    Email   : ${existing.email}`)
    console.log(`    Password: ${ADMIN_PASSWORD}`)
    console.log('────────────────────────────────────')

    await mongoose.disconnect()
    return
  }

  // ── CREATE MODE: skip if admin already exists ────────────────────────────
  if (existing) {
    console.log(`ℹ️   Admin already exists: ${existing.email}`)
    console.log('    Run with --reset to reset their password to Admin@123')
    await mongoose.disconnect()
    return
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const admin = await User.create({
    name            : ADMIN_NAME,
    email           : ADMIN_EMAIL,
    password        : hashedPassword,
    role            : 'admin',
    isEmailVerified : true,
    isActive        : true,
  })

  console.log('🎉  Admin user created successfully!')
  console.log('────────────────────────────────────')
  console.log(`    Email   : ${admin.email}`)
  console.log(`    Password: ${ADMIN_PASSWORD}`)
  console.log(`    Role    : ${admin.role}`)
  console.log('────────────────────────────────────')

  await mongoose.disconnect()
  console.log('🔌  Disconnected from MongoDB')
}

seedAdmin().catch((err) => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
