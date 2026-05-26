"use client"

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Activity, ArrowRight, CheckCircle } from 'lucide-react'
import authService from '../../../features/auth/services/authService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setStatus('error')
      setMessage('Please enter your email address.')
      return
    }

    try {
      setStatus('loading')
      const res = await authService.forgotPassword(email)
      setStatus('success')
      setMessage(res.message || 'If an account exists, a reset link has been sent.')
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-card p-8 text-center border" style={{ borderColor: 'var(--border-subtle)' }}>
          <CheckCircle className="w-16 h-16 text-[#00FF88] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Check Your Inbox</h2>
          <p className="text-slate-400 text-sm mb-6">{message}</p>
          <Link href="/login" className="btn btn-primary w-full py-2.5 flex justify-center">Return to Login</Link>
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
          <h1 className="text-xl font-bold text-white">Reset Passkey</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your operator ID to recover access</p>
        </div>

        {status === 'error' && (
          <div className="mb-4 p-3 rounded-xl text-sm border bg-red-500/10 border-red-500/20 text-red-400">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-400">Operator ID (Email)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@silm.in"
                className="input-field pl-11 bg-[#04080F]/60"
              />
            </div>
          </div>

          <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full mt-6 flex justify-center py-2.5">
            {status === 'loading' ? 'Requesting Reset...' : 'Send Reset Link'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Remembered your passkey?{' '}
          <Link href="/login" className="font-semibold text-[#00E5FF] hover:underline">Return to Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
