import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Shield, CheckCircle, Bell, Globe } from 'lucide-react'
import { selectUser, updateUserLocally } from '../../auth/store/authSlice'
import { updateProfile } from '../services/profileService'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    state: user?.state || '',
    city: user?.city || '',
    preferences: {
      language: user?.preferences?.language || 'English',
      notifications: user?.preferences?.notifications ?? true
    }
  })
  const [updating, setUpdating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      return toast.error('Please enter name and phone number')
    }

    try {
      setUpdating(true)
      const data = await updateProfile(form)
      dispatch(updateUserLocally(data.user))
      toast.success('Profile details updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>👤 Account Profile</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage your personal details, location tracking preferences, and alert notifications.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Overview */}
        <motion.div
          className="glass-card p-6 flex flex-col justify-between items-center text-center border"
          style={{ borderColor: 'var(--border-subtle)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4 w-full flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center font-black text-white text-3xl shadow-[0_0_20px_rgba(249,115,22,0.2)]"
              style={{ background: 'linear-gradient(135deg, #f97316, #10b981)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{user?.name || 'User'}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            {/* Badge role */}
            <div className="flex gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: user?.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                  color: user?.role === 'admin' ? '#ef4444' : '#3b82f6',
                  border: `1px solid ${user?.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`
                }}>
                {user?.role || 'Citizen'}
              </span>
            </div>
          </div>

          <div className="w-full pt-6 mt-6 border-t text-left text-xs text-slate-400 space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex justify-between"><span>User level:</span><span className="text-white font-bold">{user?.role?.toUpperCase()}</span></div>
            <div className="flex justify-between"><span>Account ID:</span><span className="text-slate-500 font-mono">{user?._id?.substring(0, 12)}...</span></div>
          </div>
        </motion.div>

        {/* Update Form */}
        <motion.div
          className="glass-card p-6 lg:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-base text-white">Modify Profile Details</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">State / UT</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">City / District</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Chennai"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Notification/Lang Preferences */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h4 className="font-bold text-sm text-slate-300">Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <div className="flex gap-2.5 items-center">
                    <Globe size={16} className="text-indigo-400" />
                    <span className="text-xs text-white">System Language</span>
                  </div>
                  <select
                    value={form.preferences.language}
                    onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, language: e.target.value } })}
                    className="p-1 rounded bg-slate-900 border text-xs"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                    <option>Bengali</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <div className="flex gap-2.5 items-center">
                    <Bell size={16} className="text-orange-400" />
                    <span className="text-xs text-white">SMS/Email Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.preferences.notifications}
                    onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, notifications: e.target.checked } })}
                    className="w-4 h-4 rounded text-orange-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded-xl text-sm"
            >
              {updating ? 'Saving Profile Updates...' : 'Save Profile Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage
