"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import authService from '../../../features/auth/services/authService'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verifyToken = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been successfully verified! You can now access all features.')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.')
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <div className="w-full max-w-md p-8 glass-card border relative overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#7B61FF]" />
      
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700"
        >
          {status === 'loading' && <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />}
          {status === 'success' && <CheckCircle className="w-8 h-8 text-[#00FF88]" />}
          {status === 'error' && <XCircle className="w-8 h-8 text-[#FF3D5A]" />}
        </motion.div>

        <h2 className="text-2xl font-bold text-white">Email Verification</h2>
        <p className="text-sm text-slate-400">{message}</p>

        {status === 'error' && (
          <button 
            onClick={() => router.push('/login')}
            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  )
}
