"use client"

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, MapPin, Cpu, Radio, Satellite } from 'lucide-react'
import { setSidebarMobileOpen } from '../../app/uiSlice'
import { selectUser } from '../../features/auth/store/authSlice'

const PAGE_TITLES = {
  '/dashboard':  { title: 'National Dashboard',   sub: 'Live intelligence across all 28 states' },
  '/map':        { title: 'India Live Map',        sub: 'Real-time GIS & geospatial monitoring' },
  '/fuel':       { title: 'Fuel Price Monitor',    sub: 'Live petrol & diesel rates — state-wise' },
  '/weather':    { title: 'Weather Command',       sub: 'Meteorological data & extreme alerts' },
  '/aqi':        { title: 'Air Quality Index',     sub: 'Pollution monitoring & health advisories' },
  '/emergency':  { title: 'Emergency Response',    sub: 'SOS, hospitals & rapid response' },
  '/safety':     { title: 'Safety Monitor',        sub: 'Crime alerts, safe zones & threat intel' },
  '/reports':    { title: 'Citizen Reports',       sub: 'Community incident intelligence' },
  '/alerts':     { title: 'National Alerts',       sub: 'Critical warnings & civic notifications' },
  '/admin':      { title: 'Admin Control',         sub: 'Platform management & system analytics' },
  '/profile':    { title: 'Operator Profile',      sub: 'Account settings & preferences' },
}

const Navbar = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const user = useSelector(selectUser)
  const [time, setTime] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const pageInfo = PAGE_TITLES[pathname] || {
    title: 'Smart India Live Monitor',
    sub: "India's unified civic intelligence platform",
  }

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="navbar" style={{ gap: 16 }}>

      {/* Left: Mobile menu + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => dispatch(setSidebarMobileOpen(true))}
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(0,229,255,0.06)',
            border: '1px solid rgba(0,229,255,0.12)',
            color: '#8BAFD4',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Page Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            style={{ minWidth: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#E8F4FD',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {pageInfo.title}
              </h1>
              {/* Live indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '2px 8px',
                borderRadius: 20,
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.2)',
                flexShrink: 0,
              }}>
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#00FF88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Live
                </span>
              </div>
            </div>
            <p style={{
              fontSize: 11,
              color: '#4A6B8A',
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }} className="hidden sm:block">
              {pageInfo.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Center: System metrics — desktop only */}
      <div className="hidden lg:flex" style={{ gap: 8, alignItems: 'center' }}>
        {/* Satellite */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(0,229,255,0.05)',
          border: '1px solid rgba(0,229,255,0.1)',
        }}>
          <Satellite size={12} style={{ color: '#00E5FF' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#4A6B8A', letterSpacing: '0.06em' }}>
            ISRO SAT <span style={{ color: '#00FF88' }}>●</span>
          </span>
        </div>

        {/* Live clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(0,229,255,0.04)',
          border: '1px solid rgba(0,229,255,0.08)',
        }}>
          <Radio size={11} style={{ color: '#7B61FF' }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: '#00E5FF',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
          }}>
            {time} IST
          </span>
        </div>

        {/* Location */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(255,153,51,0.06)',
          border: '1px solid rgba(255,153,51,0.15)',
        }}>
          <MapPin size={11} style={{ color: '#FF9933' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#8BAFD4' }}>Republic of India</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Search */}
        <motion.button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(0,229,255,0.05)',
            border: '1px solid rgba(0,229,255,0.1)',
            color: '#4A6B8A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          whileHover={{ borderColor: 'rgba(0,229,255,0.3)', color: '#00E5FF' }}
          whileTap={{ scale: 0.92 }}
          aria-label="Search"
        >
          <Search size={15} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(0,229,255,0.05)',
            border: '1px solid rgba(0,229,255,0.1)',
            color: '#4A6B8A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
          }}
          whileHover={{ borderColor: 'rgba(255,61,90,0.3)', color: '#FF8099' }}
          whileTap={{ scale: 0.92 }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          {/* Alert dot */}
          <span style={{
            position: 'absolute',
            top: 7, right: 7,
            width: 7, height: 7,
            borderRadius: '50%',
            background: '#FF3D5A',
            border: '1.5px solid rgba(4,8,15,1)',
            boxShadow: '0 0 6px rgba(255,61,90,0.8)',
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        </motion.button>

        {/* User Avatar */}
        <motion.button
          onClick={() => router.push('/profile')}
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(255,153,51,0.8), rgba(19,136,8,0.8))',
            border: '1px solid rgba(255,153,51,0.4)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(255,153,51,0.2)',
            flexShrink: 0,
          }}
          whileHover={{ boxShadow: '0 0 20px rgba(255,153,51,0.4)' }}
          whileTap={{ scale: 0.92 }}
          aria-label="User profile"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </motion.button>
      </div>
    </header>
  )
}

export default Navbar
