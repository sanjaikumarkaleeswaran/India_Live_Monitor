const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['alert', 'system', 'fuel', 'weather', 'safety'],
      default: 'system',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: null, // Optional link to navigate when clicked
    },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, isRead: 1 })

module.exports = mongoose.model('Notification', NotificationSchema)
