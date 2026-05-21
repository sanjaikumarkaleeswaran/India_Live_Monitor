import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Sun, Moon, Bell, Search, MapPin } from 'lucide-react'
import { setSidebarMobileOpen, toggleTheme } from '../../app/uiSlice'
import { selectUser } from '../../features/auth/store/authSlice'
import { LiveBadge } from '../ui/Badge'

// Map paths to page titles
const PAGE_TITLES = {
  '/dashboard':  { title: 'National Dashboard',   subtitle: 'Live data across all monitoring modules' },
  '/map':        { title: 'India Live Map',        subtitle: 'Real-time GIS monitoring platform' },
  '/fuel':       { title: 'Fuel Price Monitor',    subtitle: 'Live petrol & diesel prices across India' },
  '/weather':    { title: 'Weather Monitor',       subtitle: 'Current conditions and severe weather alerts' },
  '/aqi':        { title: 'Air Quality Index',     subtitle: 'Real-time AQI and pollution monitoring' },
  '/emergency':  { title: 'Emergency Response',    subtitle: 'Helplines, hospitals, and SOS services' },
  '/safety':     { title: 'Safety Monitor',        subtitle: 'Crime alerts, safe zones, and travel safety' },
  '/reports':    { title: 'Citizen Reports',       subtitle: 'Report and view community incidents' },
  '/admin':      { title: 'Admin Panel',           subtitle: 'Platform management and analytics' },
  '/profile':    { title: 'My Profile',            subtitle: 'Account settings and preferences' },
  '/settings':   { title: 'Settings',              subtitle: 'App preferences and notifications' },
}

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useSelector((s) => s.ui.theme)
  const user = useSelector(selectUser)

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'Smart India Monitor',
    subtitle: "India's unified civic intelligence platform",
  }

  // Apply theme to document
  document.documentElement.setAttribute('data-theme', theme)

  return (
    <header className="navbar">
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => dispatch(setSidebarMobileOpen(true))}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {pageInfo.title}
            </h1>
            <LiveBadge />
          </div>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Location indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
          <MapPin size={12} className="text-orange-400" />
          <span>India</span>
        </div>

        {/* Theme Toggle */}
        <motion.button
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => dispatch(toggleTheme())}
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Notifications */}
        <motion.button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.9 }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 border-2"
            style={{ borderColor: 'var(--bg-surface)' }} />
        </motion.button>

        {/* User Avatar */}
        <motion.button
          className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f97316, #10b981)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          aria-label="User profile"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </motion.button>
      </div>
    </header>
  )
}

export default Navbar
