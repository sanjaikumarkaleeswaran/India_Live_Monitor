"use client"

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Fuel, Cloud, Wind, Siren,
  Shield, FileText, Settings2, LogOut, ChevronLeft,
  Activity, X, User,
} from 'lucide-react'
import { toggleSidebar, setSidebarMobileOpen } from '../../app/uiSlice'
import { logoutUser } from '../../features/auth/store/authSlice'
import { selectUser, selectIsAdmin } from '../../features/auth/store/authSlice'
import { APP_NAME } from '../../utils/constants'
import toast from 'react-hot-toast'

const iconMap = {
  LayoutDashboard, Map, Fuel, Cloud, Wind, Siren,
  Shield, FileText, Settings2, Activity,
}

const navLinks = [
  { path: '/dashboard',  label: 'Dashboard',   icon: 'LayoutDashboard' },
  { path: '/map',        label: 'Live Map',     icon: 'Map' },
  { path: '/fuel',       label: 'Fuel Monitor', icon: 'Fuel' },
  { path: '/weather',    label: 'Weather',      icon: 'Cloud' },
  { path: '/aqi',        label: 'Air Quality',  icon: 'Wind' },
  { path: '/emergency',  label: 'Emergency',    icon: 'Siren' },
  { path: '/safety',     label: 'Safety',       icon: 'Shield' },
  { path: '/reports',    label: 'Reports',      icon: 'FileText' },
]

const adminLinks = [
  { path: '/admin',      label: 'Admin Panel',  icon: 'Settings2' },
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
    toast.success('Logged out successfully')
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'mobile-open' : ''}`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Logo ────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-5 border-b"
          style={{ borderColor: 'var(--border-subtle)', minHeight: 72 }}
        >
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* India flag colors as logo */}
                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f97316, #10b981)' }}>
                  <Activity size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    Smart India
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    LIVE MONITOR
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>

          {/* Close (mobile) */}
          <button
            onClick={closeMobile}
            className="flex md:hidden items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ──────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Label */}
          {!sidebarCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>
              Navigation
            </div>
          )}

          <ul className="space-y-1">
            {allLinks.map((link) => {
              const Icon = iconMap[link.icon]
              const isActive = pathname === link.path
              return (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    onClick={closeMobile}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 group relative
                      ${isActive
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? link.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 w-0.5 h-5 -translate-y-1/2 rounded-full bg-orange-400"
                        layoutId="activeIndicator"
                      />
                    )}
                    {Icon && <Icon size={18} className="flex-shrink-0" />}
                    {!sidebarCollapsed && (
                      <span className="truncate">{link.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── User Profile + Logout ─────────── */}
        <div className="border-t p-3 mt-auto bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-2"
              onClick={() => router.push('/profile')}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f97316, #10b981)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-white">
                  {user?.name || 'User'}
                </div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-orange-400 truncate">
                  {user?.role || 'USER'}
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 cursor-pointer
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
