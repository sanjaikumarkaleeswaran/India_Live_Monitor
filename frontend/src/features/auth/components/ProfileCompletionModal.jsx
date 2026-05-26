import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, CheckCircle, ChevronRight } from 'lucide-react'
import { selectUser, updateUserLocally } from '../store/authSlice'
import authService from '../services/authService'
import toast from 'react-hot-toast'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
]

const ProfileCompletionModal = () => {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    state: '',
    city: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // If the user is logged in but missing their state or city, show the modal.
    if (user && (!user.state || !user.city)) {
      // Small delay to make it feel natural after login
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    } else {
      setIsOpen(false)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.state || !formData.city) {
      return toast.error('Please provide both your state and city.')
    }

    setIsSubmitting(true)
    try {
      // Find state code if needed (for now, we'll just send the state name)
      const dataToUpdate = {
        state: formData.state,
        city: formData.city,
      }
      
      const response = await authService.updateProfile(dataToUpdate)
      dispatch(updateUserLocally(response.data.user))
      toast.success('Profile updated successfully!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to update profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />
            
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="text-orange-500" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-100">Complete Your Profile</h2>
                <p className="text-sm text-slate-400">
                  Provide your location so we can send you relevant fuel prices, civic alerts, and safety updates.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">State</label>
                  <select 
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-orange-500/50 transition-colors"
                  >
                    <option value="" disabled>Select your state</option>
                    {INDIAN_STATES.sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City / District</label>
                  <input 
                    type="text"
                    placeholder="e.g. Chennai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? 'Saving...' : (
                    <>
                      Save & Continue <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ProfileCompletionModal
