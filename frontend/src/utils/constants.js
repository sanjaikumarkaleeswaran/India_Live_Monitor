// Centralized application constants
export const APP_NAME = 'Smart India Live Monitor'
export const APP_VERSION = '1.0.0'
export const APP_TAGLINE = "India's Unified Civic Intelligence Platform"

// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// User roles
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
}

// Alert severity levels
export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

// Alert categories
export const ALERT_CATEGORIES = {
  WEATHER: 'weather',
  FUEL: 'fuel',
  CRIME: 'crime',
  DISASTER: 'disaster',
  HEALTH: 'health',
  UTILITY: 'utility',
  TRAFFIC: 'traffic',
}

// AQI breakpoints (based on India's NAQI standard)
export const AQI_LEVELS = [
  { max: 50,  label: 'Good',            color: '#10b981', bg: 'rgba(16,185,129,0.15)',  class: 'aqi-good' },
  { max: 100, label: 'Satisfactory',    color: '#84cc16', bg: 'rgba(132,204,22,0.15)',  class: 'aqi-good' },
  { max: 200, label: 'Moderate',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  class: 'aqi-moderate' },
  { max: 300, label: 'Poor',            color: '#f97316', bg: 'rgba(249,115,22,0.15)',  class: 'aqi-unhealthy' },
  { max: 400, label: 'Very Poor',       color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   class: 'aqi-very-bad' },
  { max: 500, label: 'Hazardous',       color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', class: 'aqi-hazardous' },
]

// Indian states list
export const INDIAN_STATES = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'DL', name: 'Delhi' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'LA', name: 'Ladakh' },
]

// National emergency helplines
export const EMERGENCY_NUMBERS = [
  { name: 'Police',            number: '100',   icon: 'shield',   color: '#3b82f6' },
  { name: 'Fire',              number: '101',   icon: 'flame',    color: '#ef4444' },
  { name: 'Ambulance',         number: '102',   icon: 'activity', color: '#10b981' },
  { name: 'NDMA Helpline',     number: '1078',  icon: 'alert',    color: '#f59e0b' },
  { name: 'Women Helpline',    number: '1091',  icon: 'heart',    color: '#ec4899' },
  { name: 'Child Helpline',    number: '1098',  icon: 'users',    color: '#8b5cf6' },
  { name: 'Senior Citizen',    number: '14567', icon: 'user',     color: '#6366f1' },
  { name: 'National Emergency',number: '112',   icon: 'phone',    color: '#f97316' },
]

// Navigation sidebar links
export const NAV_LINKS = [
  { path: '/dashboard',  label: 'Dashboard',   icon: 'LayoutDashboard' },
  { path: '/map',        label: 'Live Map',     icon: 'Map' },
  { path: '/fuel',       label: 'Fuel Monitor', icon: 'Fuel' },
  { path: '/weather',    label: 'Weather',      icon: 'Cloud' },
  { path: '/aqi',        label: 'Air Quality',  icon: 'Wind' },
  { path: '/emergency',  label: 'Emergency',    icon: 'Siren' },
  { path: '/safety',     label: 'Safety',       icon: 'Shield' },
  { path: '/reports',    label: 'Reports',      icon: 'FileText' },
  { path: '/admin',      label: 'Admin Panel',  icon: 'Settings2', adminOnly: true },
]
