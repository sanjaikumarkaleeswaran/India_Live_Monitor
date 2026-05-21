"use client"

import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * PageWrapper — The main authenticated layout shell
 * Wraps all protected pages with Sidebar + Navbar + content area
 */
const PageWrapper = ({ children }) => {
  const { sidebarCollapsed } = useSelector((s) => s.ui)

  return (
    <div className="layout-root bg-mesh">
      <Sidebar />

      {/* Main content area */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />

        <motion.main
          className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default PageWrapper
