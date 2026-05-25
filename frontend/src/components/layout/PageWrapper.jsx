"use client"

import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * PageWrapper — SILM Command Center Layout Shell
 */
const PageWrapper = ({ children }) => {
  const { sidebarCollapsed } = useSelector((s) => s.ui)

  return (
    <div className="layout-root" style={{ background: 'var(--bg-base)' }}>
      {/* Atmospheric scan line */}
      <div className="scan-line" />

      <Sidebar />

      {/* Main content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />

        <motion.main
          style={{ padding: '24px 28px', minHeight: 'calc(100vh - 64px)' }}
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
