import { AQI_LEVELS } from './constants'

/**
 * Format a number as Indian currency (₹)
 */
export const formatCurrency = (amount, decimals = 2) => {
  return `₹${Number(amount).toFixed(decimals)}`
}

/**
 * Format a date/time string to Indian locale
 */
export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }
  return new Date(dateString).toLocaleDateString('en-IN', defaultOptions)
}

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTimeAgo = (dateString) => {
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

/**
 * Get AQI level info (label, color, class)
 */
export const getAQILevel = (aqi) => {
  return AQI_LEVELS.find((l) => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1]
}

/**
 * Get price change indicator
 */
export const getPriceChange = (current, previous) => {
  const change = current - previous
  const pct = ((change / previous) * 100).toFixed(2)
  return { change: change.toFixed(2), pct, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' }
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLen = 100) => {
  if (!text) return ''
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text
}

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str) => {
  if (!str) return ''
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/**
 * Convert meters to kilometers
 */
export const metersToKm = (meters) => (meters / 1000).toFixed(1)

/**
 * Get wind direction label from degrees
 */
export const getWindDirection = (deg) => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

/**
 * Get severity color
 */
export const getSeverityColor = (severity) => {
  const colors = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#6366f1',
    low: '#10b981',
  }
  return colors[severity] || '#94a3b8'
}

export const getSeverityBg = (severity) => {
  const bgs = {
    critical: 'rgba(239,68,68,0.1)',
    high: 'rgba(245,158,11,0.1)',
    medium: 'rgba(99,102,241,0.1)',
    low: 'rgba(16,185,129,0.1)',
  }
  return bgs[severity] || 'rgba(148,163,184,0.1)'
}
