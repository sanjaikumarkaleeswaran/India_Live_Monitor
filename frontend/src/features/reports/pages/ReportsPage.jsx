"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ThumbsUp, Flag, MapPin, Plus } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getReports,
  createReport,
  verifyReport,
  flagReport
} from '../services/reportService'
import { useSocket } from '../../../hooks/useSocket'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { useSelector } from 'react-redux'
import { selectUser } from '../../auth/store/authSlice'

const ReportsPage = () => {
  const [reports, setReports] = useState([])
  const [form, setForm] = useState({ title: '', category: 'Road Damage', location: '', desc: '' })
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Fetch reports from backend
  const { data: reportsResponse, isLoading } = useQuery({
    queryKey: ['reportsList'],
    queryFn: () => getReports()
  })
  
  const user = useSelector(selectUser)
  const userCity = user?.city
  
  const displayedReports = userCity 
    ? reports.filter(r => r.location.toLowerCase().includes(userCity.toLowerCase()))
    : reports

  // Sync react-query data to local state
  useEffect(() => {
    if (reportsResponse) {
      setReports(reportsResponse)
    }
  }, [reportsResponse])

  // Setup Socket.io real-time listeners
  const socketEvents = useMemo(() => ({
    'report:new': (newReport) => {
      setReports(prev => {
        if (prev.some(r => r.id === newReport.id)) return prev
        return [newReport, ...prev]
      })
      toast.info(`New report filed: ${newReport.title}`, { icon: '📋' })
    },
    'report:update': (updatedReport) => {
      setReports(prev => prev.map(r => r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    },
    'report:delete': ({ id }) => {
      setReports(prev => prev.filter(r => r.id !== id))
    }
  }), [])

  useSocket(socketEvents)

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: verifyReport,
    onSuccess: (data) => {
      setReports(prev => prev.map(r => r.id === data.report.id ? { ...r, ...data.report } : r))
      toast.success(data.message)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify report. Please login first.')
    }
  })

  const flagMutation = useMutation({
    mutationFn: flagReport,
    onSuccess: (data) => {
      setReports(prev => prev.map(r => r.id === data.report.id ? { ...r, ...data.report } : r))
      toast.success(data.message)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to flag report. Please login first.')
    }
  })

  const submitMutation = useMutation({
    mutationFn: createReport,
    onSuccess: (data) => {
      setReports(prev => {
        if (prev.some(r => r.id === data.report.id)) return prev
        return [data.report, ...prev]
      })
      setForm({ title: '', category: 'Road Damage', location: '', desc: '' })
      setShowSubmitModal(false)
      toast.success('Your civic report has been published!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to publish report')
    }
  })

  const handleVerify = (id) => {
    verifyMutation.mutate(id)
  }

  const handleFlag = (id) => {
    flagMutation.mutate(id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.location || !form.desc) {
      return toast.error('Please fill in all fields')
    }

    submitMutation.mutate({
      title: form.title,
      category: form.category,
      locationName: form.location,
      desc: form.desc
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div className="flex justify-between items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>📋 Citizen Report Center</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Crowd-sourced civic alerts. Report hazards and verify local safety concerns.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          File Report
        </button>
      </motion.div>

      {/* Reports Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="font-bold text-base text-white">Active Crowd Reports</h3>
            {displayedReports.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-400">
                No active reports filed. Be the first to file one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {displayedReports.map((r) => (
                  <motion.div
                    key={r.id}
                    className="glass-card p-5 border"
                    style={{ borderColor: 'var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}
                    layout
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                          {r.category}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{r.title}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-emerald-400" />
                          {r.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {r.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{r.desc}</p>

                    {/* Vote buttons */}
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs text-slate-400">
                      <button
                        onClick={() => handleVerify(r.id)}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ThumbsUp size={14} className="text-emerald-400" />
                        <span>Verify ({r.verified})</span>
                      </button>

                      <button
                        onClick={() => handleFlag(r.id)}
                        disabled={flagMutation.isPending}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Flag size={14} className="text-red-400" />
                        <span>Flag ({r.flagged})</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Informative Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card p-4 text-xs" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <h4 className="font-bold text-indigo-400 flex items-center gap-1.5"><AlertCircle size={14} /> Verification Protocol</h4>
              <p className="mt-2 text-slate-300 leading-relaxed">
                Crowd-sourced report pins automatically elevate to the GIS live map once they cross 10 verifications by registered citizens. False flags reduce verification scores.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Report Modal overlay */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              className="glass-card w-full max-w-lg p-6 space-y-4 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">File Civic Incident Report</h3>
                <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Incident Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Water pipe leakage"
                    className="w-full p-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted block mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option>Road Damage</option>
                      <option>Flooding</option>
                      <option>Utility</option>
                      <option>Accident</option>
                      <option>Fire Hazard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Location Details</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Indiranagar, Bengaluru"
                      className="w-full p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    placeholder="Provide precise details of the incident..."
                    className="w-full p-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Publishing...' : 'Publish Report'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReportsPage
