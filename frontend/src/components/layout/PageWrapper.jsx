"use client"

import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ProfileCompletionModal from '../../features/auth/components/ProfileCompletionModal'
import AiChatWidget from '../ai/AiChatWidget'
import { useSocket } from '../../hooks/useSocket'

/**
 * PageWrapper — SILM Command Center Layout Shell
 */
const PageWrapper = ({ children }) => {
  const { sidebarCollapsed } = useSelector((s) => s.ui)

  useSocket({
    'emergency:location_updated': (data) => {
      toast.error(`🚨 SOS SIGNAL RECEIVED!\nLatitude: ${data.location?.lat.toFixed(4)}\nLongitude: ${data.location?.lng.toFixed(4)}`, {
        duration: 8000,
        style: { border: '1px solid #FF3D5A' }
      })
    }
  })

  return (
    <div className="layout-root" style={{ background: 'var(--bg-base)' }}>
      {/* Atmospheric scan line */}
      <div className="scan-line" />

      {/* Global Modals */}
      <ProfileCompletionModal />
      <AiChatWidget />

      <Sidebar />

      {/* Main content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />

        <motion.main
          className="page-content"
          style={{ minHeight: 'calc(100vh - 64px)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default PageWrapper
