"use client"

import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, MapPin, Cpu, Radio, Satellite, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { setSidebarMobileOpen } from '../../app/uiSlice'
import { selectUser } from '../../features/auth/store/authSlice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead } from '../../features/notifications/services/notificationService'

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
  const queryClient = useQueryClient()
  const [time, setTime] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notifRef = useRef(null)

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchInterval: 60000, // refresh every minute
    enabled: !!user,
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  })

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: notificationsOpen ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.05)',
              border: `1px solid ${notificationsOpen ? 'rgba(0,229,255,0.3)' : 'rgba(0,229,255,0.1)'}`,
              color: notificationsOpen ? '#00E5FF' : '#4A6B8A',
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
            {notifData?.meta?.unreadCount > 0 && (
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
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card border flex flex-col overflow-hidden z-50 shadow-2xl"
                style={{ borderColor: 'var(--border-subtle)', maxHeight: '400px' }}
              >
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="font-bold text-sm text-slate-200">Notifications</h3>
                  {notifData?.meta?.unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[10px] font-semibold text-[#00E5FF] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {!notifData?.data || notifData.data.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications right now
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifData.data.map(n => (
                        <div 
                          key={n._id} 
                          className={`p-3 flex gap-3 transition-colors ${!n.isRead ? 'bg-white/5 cursor-pointer hover:bg-white/10' : ''}`}
                          onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.severity === 'critical' ? <AlertTriangle size={14} className="text-red-400" /> :
                             n.severity === 'warning' ? <AlertTriangle size={14} className="text-amber-400" /> :
                             <Info size={14} className="text-[#00E5FF]" />}
                          </div>
                          <div>
                            <p className={`text-xs ${!n.isRead ? 'font-semibold text-white' : 'text-slate-300'}`}>{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
