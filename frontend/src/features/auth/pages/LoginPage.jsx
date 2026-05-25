"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Activity, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../../../components/ui/Button'

const LoginPage = () => {
  const { login, isLoading, error, clearAuthError, isAuthenticated } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    clearAuthError()
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    await login(form)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7B61FF, transparent)' }} />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(123,97,255,0.2))',
              border: '1px solid rgba(0,229,255,0.3)',
              boxShadow: '0 0 20px rgba(0,229,255,0.15)'
            }}>
            <Activity size={28} style={{ color: '#00E5FF' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#E8F4FD', letterSpacing: '-0.02em' }}>
            SILM <span style={{ color: '#00E5FF', textShadow: '0 0 12px rgba(0,229,255,0.5)' }}>Command</span>
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-widest uppercase" style={{ color: '#4A6B8A', fontSize: 10 }}>
            India's Unified Civic Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#E8F4FD' }}>
              Authentication
            </h2>
            <p className="text-sm mt-1" style={{ color: '#8BAFD4' }}>
              Secure access to the national monitoring grid
            </p>
          </div>

          {/* Server Error */}
          {error && (
            <motion.div
              className="mb-4 p-3 rounded-xl text-sm border"
              style={{ background: 'rgba(255,61,90,0.08)', borderColor: 'rgba(255,61,90,0.2)', color: '#FF8099' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#4A6B8A' }}>
                Operator ID (Email)
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#8BAFD4' }} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="operator@silm.in"
                  className={`input-field pl-11 ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  style={{ background: 'rgba(4,8,15,0.6)' }}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: '#FF8099' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6B8A' }}>
                  Passkey
                </label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: '#00E5FF', textDecoration: 'none' }}>
                  Reset link
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#8BAFD4' }} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  style={{ background: 'rgba(4,8,15,0.6)' }}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: '#8BAFD4', background: 'transparent', border: 'none' }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: '#FF8099' }}>{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-6 flex justify-center py-2.5"
            >
              {isLoading ? 'Authenticating...' : 'Initialize Session'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm" style={{ color: '#8BAFD4' }}>
            Unregistered operator?{' '}
            <Link href="/register" style={{ fontWeight: 600, color: '#00E5FF', textDecoration: 'none' }}>
              Request Access
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          🇮🇳 Built for India · Free for all citizens
        </p>
      </motion.div>
    </div>
  )
}

export default LoginPage
