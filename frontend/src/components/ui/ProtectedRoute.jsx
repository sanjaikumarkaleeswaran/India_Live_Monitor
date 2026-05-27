"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectIsAdmin } from '../../features/auth/store/authSlice'
import { SkeletonCard } from './Skeleton'
import { ShieldAlert, Lock, Eye, EyeOff, LogOut, Shield } from 'lucide-react'

// ── Page-level loader skeleton ────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="p-6 space-y-4 min-h-[60vh] flex flex-col justify-center">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
)

// ── Admin PIN Gate ────────────────────────────────────────────────────────────
// The real admin PIN is stored in the env (NEXT_PUBLIC_ADMIN_PIN).
// Falls back to '112358' (Fibonacci) if not set.
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '112358'
const PIN_SESSION_KEY = 'silm_admin_pin_verified'
const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 60

const AdminPinGate = ({ onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [shaking, setShaking] = useState(false)
  const inputs = useRef([])

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return
    const timer = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setAttempts(0)
        setError('')
      } else {
        setCountdown(remaining)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [lockedUntil])

  const handleInput = (index, value) => {
    if (lockedUntil) return
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = char
    setPin(next)
    setError('')

    // Auto-advance
    if (char && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (char && index === 5) {
      const full = [...next.slice(0, 5), char].join('')
      if (full.length === 6) submitPin(full)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus()
      const next = [...pin]
      next[index - 1] = ''
      setPin(next)
    }
    if (e.key === 'Enter') {
      const full = pin.join('')
      if (full.length === 6) submitPin(full)
    }
  }

  const submitPin = useCallback((code) => {
    if (lockedUntil) return

    if (code === ADMIN_PIN) {
      // Success — mark session as verified
      sessionStorage.setItem(PIN_SESSION_KEY, 'true')
      onSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin(['', '', '', '', '', ''])
      inputs.current[0]?.focus()

      // Shake animation
      setShaking(true)
      setTimeout(() => setShaking(false), 600)

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000
        setLockedUntil(until)
        setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS}s.`)
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`)
      }
    }
  }, [attempts, lockedUntil, onSuccess])

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c })
    setPin(next)
    if (pasted.length === 6) submitPin(pasted)
    else inputs.current[pasted.length]?.focus()
  }

  const isLocked = !!lockedUntil

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,12,0.97)', backdropFilter: 'blur(20px)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }} />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 text-center space-y-6"
          style={{
            background: 'rgba(8,14,24,0.95)',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 0 60px rgba(239,68,68,0.08), 0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
              animate={isLocked ? { rotate: [0, -5, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              {isLocked ? (
                <Lock size={28} style={{ color: '#ef4444' }} />
              ) : (
                <Shield size={28} style={{ color: '#ef4444' }} />
              )}
            </motion.div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              {isLocked ? 'Access Suspended' : 'Admin Verification'}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              {isLocked
                ? `Too many failed attempts. Try again in ${countdown}s`
                : 'Enter the 6-digit admin access PIN to proceed'}
            </p>
          </div>

          {/* PIN Input Grid */}
          <motion.div
            className="flex gap-2 justify-center"
            animate={shaking ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isLocked}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl outline-none transition-all"
                style={{
                  background: digit ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${digit ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: '#f1f5f9',
                  caretColor: '#ef4444',
                  boxShadow: digit ? '0 0 12px rgba(239,68,68,0.15)' : 'none',
                  cursor: isLocked ? 'not-allowed' : 'text',
                  opacity: isLocked ? 0.4 : 1,
                }}
                autoFocus={i === 0}
                autoComplete="off"
              />
            ))}
          </motion.div>

          {/* Show/Hide PIN */}
          <button
            type="button"
            onClick={() => setShowPin(v => !v)}
            className="flex items-center gap-1.5 mx-auto text-xs transition-colors"
            style={{ color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPin ? 'Hide' : 'Show'} PIN
          </button>

          {/* Error / Lockout */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 justify-center p-3 rounded-xl text-xs"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                <ShieldAlert size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lockout bar */}
          {isLocked && (
            <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(239,68,68,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)', transformOrigin: 'left' }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: LOCKOUT_SECONDS, ease: 'linear' }}
              />
            </div>
          )}

          {/* Hint for dev */}
          {process.env.NODE_ENV !== 'production' && !isLocked && (
            <p className="text-[10px]" style={{ color: '#1e293b' }}>
              dev: {ADMIN_PIN}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
/**
 * Guards routes behind authentication.
 * Redirects to /login if not authenticated.
 */
export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isInitialized, router])

  if (!isInitialized || !isAuthenticated) {
    return <PageLoader />
  }

  return children
}

// ── AdminRoute ─────────────────────────────────────────────────────────────────
/**
 * Triple-layered guard for admin routes:
 *
 * Layer 1: Next.js Edge Middleware (server-side, in middleware.js)
 *          → Checks JWT cookie, redirects non-admins before page loads
 *
 * Layer 2: Role check (client-side Redux state)
 *          → Catches any client-side navigation bypasses
 *
 * Layer 3: PIN Challenge gate
 *          → Requires a 6-digit secret PIN after role verification
 *          → Verified state is session-scoped (cleared on tab close)
 *          → Brute-force locked after 5 failed attempts for 60s
 */
export const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isAdmin = useSelector(selectIsAdmin)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()
  const [pinVerified, setPinVerified] = useState(false)

  // Check if PIN already verified this session
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const verified = sessionStorage.getItem(PIN_SESSION_KEY)
      if (verified === 'true') setPinVerified(true)
    }
  }, [])

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (!isAdmin) {
        router.replace('/403')
      }
    }
  }, [isAuthenticated, isAdmin, isInitialized, router])

  if (!isInitialized || !isAuthenticated || !isAdmin) {
    return <PageLoader />
  }

  // Layer 3: PIN Gate (shown after role verified, before content)
  if (!pinVerified) {
    return (
      <AnimatePresence mode="wait">
        <AdminPinGate key="pin-gate" onSuccess={() => setPinVerified(true)} />
      </AnimatePresence>
    )
  }

  return children
}

// ── PublicRoute ────────────────────────────────────────────────────────────────
/**
 * Redirects already-authenticated users away from login/register.
 */
export const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  if (!isInitialized || isAuthenticated) {
    return <PageLoader />
  }

  return children
}
