"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Activity, ArrowRight, Eye, EyeOff } from 'lucide-react'
import authService from '../../../features/auth/services/authService'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing reset token.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setStatus('error')
      setMessage('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }

    try {
      setStatus('loading')
      const res = await authService.resetPassword(token, password)
      setStatus('success')
      setMessage(res.message || 'Password reset successfully.')
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Failed to reset password.')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-card p-8 text-center border" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-bold text-[#00FF88] mb-2">Password Reset Successful!</h2>
          <p className="text-slate-400 text-sm mb-6">You will be redirected to the login page shortly.</p>
          <Link href="/login" className="btn btn-primary w-full py-2.5 flex justify-center">Go to Login</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        className="relative w-full max-w-md glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 32 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
            <Activity size={24} style={{ color: '#00E5FF' }} />
          </div>
          <h1 className="text-xl font-bold text-white">Create New Passkey</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your new secure passkey below</p>
        </div>

        {status === 'error' && (
          <div className="mb-4 p-3 rounded-xl text-sm border bg-red-500/10 border-red-500/20 text-red-400">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-400">New Passkey</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11 pr-11 bg-[#04080F]/60"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-400">Confirm Passkey</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11 bg-[#04080F]/60"
              />
            </div>
          </div>

          <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full mt-6 flex justify-center py-2.5">
            {status === 'loading' ? 'Saving...' : 'Set New Passkey'} <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  )
}
