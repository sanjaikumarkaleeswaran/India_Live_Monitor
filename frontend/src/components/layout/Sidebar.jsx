"use client"

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Fuel, Cloud, Wind, Siren,
  Shield, FileText, Settings2, LogOut, ChevronLeft,
  Activity, X, Cpu, AlertTriangle, User,
} from 'lucide-react'
import { toggleSidebar, setSidebarMobileOpen } from '../../app/uiSlice'
import { logoutUser } from '../../features/auth/store/authSlice'
import { selectUser, selectIsAdmin } from '../../features/auth/store/authSlice'
import toast from 'react-hot-toast'

const iconMap = { LayoutDashboard, Map, Fuel, Cloud, Wind, Siren, Shield, FileText, Settings2, Activity, User }

const navLinks = [
  { path: '/dashboard',  label: 'Dashboard',     icon: 'LayoutDashboard', color: '#00E5FF' },
  { path: '/map',        label: 'Live Map',       icon: 'Map',             color: '#00FF88' },
  { path: '/fuel',       label: 'Fuel Monitor',   icon: 'Fuel',            color: '#FFB830' },
  { path: '/weather',    label: 'Weather',        icon: 'Cloud',           color: '#7B61FF' },
  { path: '/aqi',        label: 'Air Quality',    icon: 'Wind',            color: '#00C96E' },
  { path: '/emergency',  label: 'Emergency',      icon: 'Siren',           color: '#FF3D5A' },
  { path: '/safety',     label: 'Safety',         icon: 'Shield',          color: '#00E5FF' },
  { path: '/reports',    label: 'Reports',        icon: 'FileText',        color: '#FFB830' },
  { path: '/alerts',     label: 'Alerts',         icon: 'Activity',        color: '#FF3D5A' },
  { path: '/profile',    label: 'My Profile',     icon: 'User',            color: '#7B61FF' },
]

const adminLinks = [
  { path: '/admin', label: 'Admin Panel', icon: 'Settings2', color: '#7B61FF' },
]

const Sidebar = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector((s) => s.ui)
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Session terminated')
    router.push('/login')
  }

  const closeMobile = () => dispatch(setSidebarMobileOpen(false))
  const allLinks = isAdmin ? [...navLinks, ...adminLinks] : navLinks

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'mobile-open' : ''}`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Logo ── */}
        <div style={{
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
        }}>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {/* Logo Icon */}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(123,97,255,0.2))',
                  border: '1px solid rgba(0,229,255,0.3)',
                  boxShadow: '0 0 20px rgba(0,229,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Cpu size={18} color="#00E5FF" />
                </div>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 800,
                    color: '#E8F4FD',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}>
                    SILM
                    <span style={{ color: '#00E5FF', marginLeft: 4 }}>🇮🇳</span>
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 600,
                    color: '#4A6B8A',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}>
                    LIVE COMMAND CENTER
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle — desktop */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:flex"
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.1)',
              color: '#4A6B8A',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeft size={14} />
            </motion.div>
          </button>

          {/* Close — mobile */}
          <button
            onClick={closeMobile}
            className="flex md:hidden"
            style={{ color: '#4A6B8A', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── System Status ── */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              margin: '12px 12px 4px',
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(0,255,136,0.06)',
              border: '1px solid rgba(0,255,136,0.15)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <div className="live-dot" />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#00FF88', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              All Systems Live
            </span>
          </motion.div>
        )}

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {!sidebarCollapsed && (
            <div style={{
              padding: '8px 10px 6px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2A4A6A',
            }}>
              Navigation
            </div>
          )}

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allLinks.map((link) => {
              const Icon = iconMap[link.icon]
              const isActive = pathname === link.path

              return (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    onClick={closeMobile}
                    title={sidebarCollapsed ? link.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      position: 'relative',
                      transition: 'all 0.18s',
                      color: isActive ? link.color : '#4A6B8A',
                      background: isActive
                        ? `linear-gradient(135deg, ${link.color}12, ${link.color}06)`
                        : 'transparent',
                      border: `1px solid ${isActive ? `${link.color}30` : 'transparent'}`,
                      boxShadow: isActive ? `0 0 16px ${link.color}10` : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(0,229,255,0.05)'
                        e.currentTarget.style.color = '#8BAFD4'
                        e.currentTarget.style.borderColor = 'rgba(0,229,255,0.1)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#4A6B8A'
                        e.currentTarget.style.borderColor = 'transparent'
                      }
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeBar"
                        style={{
                          position: 'absolute',
                          left: 0, top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3, height: 24,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          background: link.color,
                          boxShadow: `2px 0 12px ${link.color}90`,
                        }}
                      />
                    )}
                    {Icon && (
                      <Icon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: isActive ? link.color : 'currentColor',
                          filter: isActive ? `drop-shadow(0 0 4px ${link.color}80)` : 'none',
                        }}
                      />
                    )}
                    {!sidebarCollapsed && (
                      <span style={{ truncate: true }}>{link.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── User + Logout ── */}
        <div style={{
          borderTop: '1px solid rgba(0,229,255,0.08)',
          padding: 10,
          background: 'rgba(0,0,0,0.3)',
        }}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => router.push('/profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 6,
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.08)',
                transition: 'all 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 34, height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FF9933, #138808)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: 'white',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(255,153,51,0.3)',
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E8F4FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#00E5FF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {user?.role || 'OPERATOR'}
                </div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(255,61,90,0.06)',
              border: '1px solid rgba(255,61,90,0.12)',
              color: '#FF8099',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={sidebarCollapsed ? 'Logout' : undefined}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,61,90,0.12)'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(255,61,90,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,61,90,0.06)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Terminate Session</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
