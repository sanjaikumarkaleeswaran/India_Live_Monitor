"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Phone, Siren, HeartPulse, ShieldAlert, Compass, MapPin,
  Clock, AlertTriangle, AlertCircle, Heart, X, CheckCircle, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getEmergencyContacts, getNearbyHospitals, triggerSOS } from '../services/emergencyService'
import { SkeletonCard } from '../../../components/ui/Skeleton'

const FIRST_AID_GUIDES = [
  {
    title: 'Heatstroke Treatment',
    steps: [
      'Move the person to a cool, shaded area immediately.',
      'Apply cool, wet cloths or pour cool water over their body.',
      'Fan the person to increase evaporation cooling.',
      'Do not give them cold water to drink if they are semi-conscious.'
    ]
  },
  {
    title: 'First Aid for Burns',
    steps: [
      'Hold the burned area under cool running water for 10-15 minutes.',
      'Do not apply ice, butter, or ointment directly to the burn.',
      'Cover the burn loosely with a sterile gauze bandage.',
      'Administer pain relievers and seek professional medical aid.'
    ]
  },
  {
    title: 'Flood Safety Actions',
    steps: [
      'Move to higher ground immediately. Avoid low-lying areas.',
      'Do not attempt to drive or walk through floodwaters.',
      'Turn off all electrical switches and main power lines.',
      'Keep a bag of dry foods, water, torches, and first-aid supplies ready.'
    ]
  }
]

const EmergencyPage = () => {
  const [sosCountdown, setSosCountdown] = useState(null)
  const [sosActive, setSosActive] = useState(false)
  const [activeGuide, setActiveGuide] = useState(null)

  // Fetch emergency contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['emergencyContactsList'],
    queryFn: () => getEmergencyContacts(),
  })

  // Fetch nearby hospitals
  const { data: hospitals, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['nearbyHospitals'],
    queryFn: () => getNearbyHospitals(28.5672, 77.2100), // Center Delhi as default
  })

  // SOS mutation
  const sosMutation = useMutation({
    mutationFn: triggerSOS,
    onSuccess: (data) => {
      setSosActive(true)
      toast.success(data.message || 'SOS signal broadcasted successfully!', {
        duration: 6000,
        icon: '🆘'
      })
    },
    onError: () => {
      toast.error('Failed to trigger SOS. Call 112 directly.')
      setSosCountdown(null)
    }
  })

  // Count down effect for SOS trigger
  useEffect(() => {
    if (sosCountdown === null) return
    if (sosCountdown === 0) {
      setSosCountdown(null)
      
      const triggerWithCoords = (lat, lng) => {
        sosMutation.mutate({
          lat,
          lng,
          message: 'Critical citizen SOS alert triggered from Smart India Dashboard'
        })
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => triggerWithCoords(pos.coords.latitude, pos.coords.longitude),
          (err) => {
            console.warn('Geolocation failed or denied, using default:', err.message)
            triggerWithCoords(28.5672, 77.2100)
          },
          { timeout: 5000 }
        )
      } else {
        triggerWithCoords(28.5672, 77.2100)
      }
      return
    }

    const timer = setTimeout(() => {
      setSosCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [sosCountdown])

  const startSOS = () => {
    setSosCountdown(3) // 3-second delay to allow cancellation
  }

  const cancelSOS = () => {
    setSosCountdown(null)
    toast.success('SOS trigger cancelled')
  }

  const toggleGuide = (idx) => {
    setActiveGuide(activeGuide === idx ? null : idx)
  }

  const isLoading = contactsLoading || hospitalsLoading

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🚨 Emergency Response & SOS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🚨 Emergency Response & SOS</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Broadcast immediate SOS signals and find local emergency facilities.
        </p>
      </motion.div>

      {/* Main SOS Trigger Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        {/* SOS Panel */}
        <motion.div
          className="glass-card p-6 flex flex-col justify-between items-center text-center min-h-[300px] border-red-500/20"
          style={{ background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(13, 27, 46, 0.4) 100%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <h3 className="font-black text-xl text-red-500 flex items-center justify-center gap-2">
              <Siren className="animate-pulse" size={20} />
              SOS Broadcast
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Sends your current location coordinates, name, and emergency details to local control cells.
            </p>
          </div>

          {/* SOS Trigger Actions */}
          <div className="my-6 relative">
            <AnimatePresence mode="wait">
              {sosCountdown !== null ? (
                <motion.button
                  key="countdown"
                  onClick={cancelSOS}
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center font-bold text-white bg-amber-600 hover:bg-amber-700 animate-pulse border-4 border-amber-400"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <span className="text-sm uppercase tracking-widest">Cancel</span>
                  <span className="text-4xl font-black mt-1">{sosCountdown}</span>
                </motion.button>
              ) : sosActive ? (
                <motion.div
                  key="active"
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center font-bold text-white bg-red-600 border-4 border-red-400"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <AlertCircle size={32} />
                  <span className="text-xs uppercase mt-1">SOS ACTIVE</span>
                </motion.div>
              ) : (
                <motion.button
                  key="idle"
                  onClick={startSOS}
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center font-black text-white bg-red-600 hover:bg-red-700 transition-all border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Siren size={36} />
                  <span className="text-sm uppercase mt-1 tracking-wider">Trigger SOS</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {sosActive ? (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Responder Unit Dispatched</span>
            ) : (
              <span>Standard Delay: 3s</span>
            )}
          </div>
        </motion.div>

        {/* Nearby Hospitals & Trauma support */}
        <motion.div className="glass-card p-5 lg:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <HeartPulse size={18} className="text-emerald-400" />
            Trauma & Medical Support Nearby
          </h3>
          <div className="space-y-3">
            {hospitals?.hospitals?.map((h) => (
              <div key={h.name} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors border"
                style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin size={12} className="text-emerald-400" />
                    {h.name}
                  </p>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>Dist: {h.distance} km</span>
                    <span>Beds: {h.beds.available} available</span>
                  </div>
                </div>
                <a href={`tel:${h.phone}`} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-white hover:bg-emerald-500 transition-colors"
                  style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                  Call Center
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Helplines and First Aid Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        {/* Contacts */}
        <motion.div className="glass-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>National Helplines Grid</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            {contacts?.contacts?.slice(0, 10).map((c) => (
              <a key={c.number} href={`tel:${c.number}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border group"
                style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs font-semibold text-slate-400">{c.name}</p>
                  <p className="text-sm font-black mt-1" style={{ color: c.color || '#3b82f6' }}>{c.number}</p>
                </div>
                <Phone size={14} className="text-slate-500 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Guides Accordion */}
        <motion.div className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>First Aid & Safety Guides</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FIRST_AID_GUIDES.map((guide, idx) => (
              <div key={idx} className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => toggleGuide(idx)}
                  className="w-full flex items-center justify-between p-3 text-sm font-semibold text-white bg-white/5"
                >
                  <span>{guide.title}</span>
                  <ChevronDown size={14} className={`transform transition-transform ${activeGuide === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeGuide === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-3 bg-slate-900/40 text-xs space-y-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {guide.steps.map((step, sIdx) => (
                        <p key={sIdx} className="flex gap-2 items-start">
                          <span className="font-bold text-orange-400">{sIdx + 1}.</span>
                          <span>{step}</span>
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EmergencyPage
