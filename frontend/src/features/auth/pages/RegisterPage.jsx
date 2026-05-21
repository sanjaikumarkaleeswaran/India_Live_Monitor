import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, Activity, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../../../components/ui/Button'

const RegisterPage = () => {
  const { register, isLoading, error, clearAuthError } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { clearAuthError() }, [])

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++
    const levels = [
      { label: '', color: '' },
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f59e0b' },
      { label: 'Good', color: '#6366f1' },
      { label: 'Strong', color: '#10b981' },
    ]
    return { score, ...levels[score] }
  }

  const strength = getPasswordStrength(form.password)

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Full name is required'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address'
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
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
    const { confirmPassword, ...data } = form
    await register(data)
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 py-10">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #f97316, #10b981)' }}>
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Your Account</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Join millions of Indians monitoring live civic data
          </p>
        </div>

        <div className="glass-card p-8">
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {['100% Free', 'Real-time Alerts', 'GIS Map Access', 'Emergency SOS'].map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>

          {error && (
            <motion.div className="mb-4 p-3 rounded-xl text-sm text-red-400 border"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-name" name="name" type="text" autoComplete="name"
                  value={form.name} onChange={handleChange} placeholder="Rahul Sharma"
                  className={`input-field pl-11 ${errors.name ? 'error' : ''}`} />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={handleChange} placeholder="rahul@example.com"
                  className={`input-field pl-11 ${errors.email ? 'error' : ''}`} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Mobile Number <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium pr-2 border-r"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>+91</div>
                <input id="reg-phone" name="phone" type="tel" autoComplete="tel"
                  value={form.phone} onChange={handleChange} placeholder="98765 43210"
                  className={`input-field pl-20 ${errors.phone ? 'error' : ''}`} />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={form.password} onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'error' : ''}`} />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: strength.color }}>
                    {strength.label} password
                  </p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-confirm-password" name="confirmPassword"
                  type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                  value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                  className={`input-field pl-11 ${errors.confirmPassword ? 'error' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2">
              Create Free Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          🇮🇳 Free for all Indian citizens · No credit card required
        </p>
      </motion.div>
    </div>
  )
}

export default RegisterPage
