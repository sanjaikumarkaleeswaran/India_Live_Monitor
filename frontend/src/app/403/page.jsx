"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldOff, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base, #020c18)' }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12), transparent)' }}
        />
      </div>

      <motion.div
        className="relative text-center max-w-md w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
            border: '1px solid rgba(239,68,68,0.25)',
            boxShadow: '0 0 40px rgba(239,68,68,0.1)',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <ShieldOff size={36} style={{ color: '#ef4444' }} />
        </motion.div>

        {/* Error code */}
        <p
          className="text-8xl font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.05em',
          }}
        >
          403
        </p>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
          Access Denied
        </h1>

        <p className="text-sm mb-2" style={{ color: '#64748b' }}>
          You do not have permission to access the Admin Control Panel.
        </p>

        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs mb-8"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#fca5a5',
          }}
        >
          <AlertTriangle size={12} />
          This attempt has been logged.
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: '#1e3a5f' }}>
          🇮🇳 Smart India Live Monitor — Secured Command Layer
        </p>
      </motion.div>
    </div>
  )
}
