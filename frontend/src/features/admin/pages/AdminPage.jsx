"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Siren, Users, ShieldAlert, Cpu, Database, Network, Clock,
  PlusCircle, RefreshCw, Trash2, ShieldCheck, UserCheck, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, updateUserRole, getSystemHealth } from '../services/adminService'
import { createAlert } from '../../alerts/services/alertService'
import { getSOSRequests, updateSOSStatus } from '../../emergency/services/emergencyService'
import { useSocket } from '../../../hooks/useSocket'
import { SkeletonCard, SkeletonTable } from '../../../components/ui/Skeleton'

const AdminPage = () => {
  const queryClient = useQueryClient()
  const [alertForm, setAlertForm] = useState({
    title: '',
    description: '',
    type: 'Cyclone Warning',
    severity: 'critical',
    category: 'weather',
    affectedStates: ''
  })
  const [activeTab, setActiveTab] = useState('health') // 'health', 'alerts', 'users', 'sos'

  // Fetch users list
  const { data: usersResponse, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getUsers(),
    enabled: activeTab === 'users'
  })

  // Fetch system health
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealth,
    enabled: activeTab === 'health',
    refetchInterval: 10000 // refetch every 10 seconds
  })

  // Role mutation
  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: (data) => {
      toast.success(`Role updated for ${data.user.name}`)
      queryClient.invalidateQueries(['adminUsers'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update role')
    }
  })

  // Alert creation mutation
  const createAlertMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      toast.success('Civic emergency alert successfully published!')
      setAlertForm({
        title: '',
        description: '',
        type: 'Cyclone Warning',
        severity: 'critical',
        category: 'weather',
        affectedStates: ''
      })
      queryClient.invalidateQueries(['alerts'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to publish alert')
    }
  })

  const handleRoleChange = (userId, newRole) => {
    roleMutation.mutate({ userId, role: newRole })
  }

  const handleAlertSubmit = (e) => {
    e.preventDefault()
    if (!alertForm.title || !alertForm.description) {
      return toast.error('Please fill in title and description')
    }

    const formattedAlert = {
      ...alertForm,
      affectedStates: alertForm.affectedStates.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
      location: {
        type: 'Point',
        coordinates: [78.9629, 20.5937] // Default India center
      }
    }

    createAlertMutation.mutate(formattedAlert)
  }

  const [sosRequests, setSosRequests] = useState([])

  // Query to fetch active SOS requests
  const { data: sosResponse, isLoading: sosLoading } = useQuery({
    queryKey: ['adminSOSList'],
    queryFn: () => getSOSRequests(),
    enabled: activeTab === 'sos'
  })

  // Sync SOS data
  useEffect(() => {
    if (sosResponse?.sosRequests) {
      setSosRequests(sosResponse.sosRequests)
    }
  }, [sosResponse])

  // Setup Socket.io real-time listeners for SOS alerts
  const socketEvents = useMemo(() => ({
    'emergency:sos': (newSOS) => {
      setSosRequests(prev => {
        if (prev.some(s => s.id === newSOS.id)) return prev
        return [newSOS, ...prev]
      })
      toast.error(`🚨 EMERGENCY SOS received from ${newSOS.name}!`, {
        duration: 10000,
        icon: '🆘'
      })
    },
    'emergency:sos_updated': (updatedSOS) => {
      setSosRequests(prev => prev.map(s => s.id === updatedSOS.id ? { ...s, ...updatedSOS } : s))
    }
  }), [])

  useSocket(socketEvents)

  const sosStatusMutation = useMutation({
    mutationFn: updateSOSStatus,
    onSuccess: (data) => {
      setSosRequests(prev => prev.map(s => s.id === data.sos.id ? { ...s, ...data.sos } : s))
      toast.success(`SOS marked as ${data.sos.status}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update SOS status')
    }
  })

  const resolveSOS = (id) => {
    sosStatusMutation.mutate({ id, status: 'Resolved' })
  }

  const dispatchResponders = (id) => {
    sosStatusMutation.mutate({ id, status: 'Dispatched' })
  }

  const systemHealth = healthData?.system || {
    uptime: 'Loading...',
    cpu: 'Loading...',
    ram: 'Loading...',
    db: 'Loading...',
    ping: 'Loading...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex justify-between items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🛡️ Control & Admin Panel</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            System maintenance, user moderation, and instant public alert triggers.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-1 flex-wrap">
        {['health', 'alerts', 'users', 'sos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-semibold capitalize relative transition-all"
            style={{
              color: activeTab === tab ? '#f97316' : 'var(--text-secondary)'
            }}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                layoutId="activeAdminTab"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div>
        {activeTab === 'health' && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* System Status */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Cpu size={16} className="text-orange-400" />
                Server Health
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Server Uptime</span><span className="font-semibold text-white">{systemHealth.uptime}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">CPU Usage</span><span className="font-semibold text-white">{systemHealth.cpu}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Memory Usage</span><span className="font-semibold text-white">{systemHealth.ram}</span></div>
              </div>
            </div>

            {/* DB Status */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Database size={16} className="text-blue-400" />
                Database layer
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="font-semibold text-emerald-400">{systemHealth.db}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Ping latency</span><span className="font-semibold text-white">{systemHealth.ping}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Active Clusters</span><span className="font-semibold text-white">3 Nodes (M0)</span></div>
              </div>
            </div>

            {/* API Health */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Network size={16} className="text-emerald-400" />
                API Health
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Traffic</span><span className="font-semibold text-white">Minimal (Dev)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Failures (24h)</span><span className="font-semibold text-emerald-400">0.00%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">System Clock</span><span className="font-semibold text-white">Synced NTP</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Public Alerts */}
        {activeTab === 'alerts' && (
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-5 lg:col-span-2 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PlusCircle size={16} className="text-orange-400" />
                Publish Emergency Alert
              </h3>

              <form onSubmit={handleAlertSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Alert Title</label>
                  <input
                    type="text"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    placeholder="e.g. Cyclone Mocha landfall warning"
                    className="w-full p-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={alertForm.description}
                    onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                    placeholder="Provide safety measures and warnings..."
                    className="w-full p-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted block mb-1">Alert Type</label>
                    <select
                      value={alertForm.type}
                      onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option>Cyclone Warning</option>
                      <option>Heatwave Alert</option>
                      <option>Flood Warning</option>
                      <option>Air Quality Alert</option>
                      <option>Heavy Rain Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Severity</label>
                    <select
                      value={alertForm.severity}
                      onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Affected States (comma separated)</label>
                    <input
                      type="text"
                      value={alertForm.affectedStates}
                      onChange={(e) => setAlertForm({ ...alertForm, affectedStates: e.target.value })}
                      placeholder="e.g. TN, AP, OD"
                      className="w-full p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createAlertMutation.isPending}
                  className="w-full py-2.5 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 transition-colors text-white text-sm"
                >
                  {createAlertMutation.isPending ? 'Publishing...' : 'Publish Public Broadcast'}
                </button>
              </form>
            </div>

            <div className="glass-card p-5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <h4 className="font-bold text-sm text-red-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={16} /> Important Note
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emergency alerts trigger web push alerts to all registered citizens and render colored danger polygons immediately inside the GIS Live Map. Ensure information is verified before broadcasting.
              </p>
            </div>
          </motion.div>
        )}

        {/* User Moderation */}
        {activeTab === 'users' && (
          <motion.div className="glass-card p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Users size={16} className="text-orange-400" />
                Moderation System
              </h3>
              <button onClick={() => refetchUsers()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <RefreshCw size={14} className="text-slate-400" />
              </button>
            </div>

            {usersLoading ? (
              <SkeletonTable />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <th className="py-3 font-semibold text-slate-400">Name</th>
                      <th className="py-3 font-semibold text-slate-400">Email</th>
                      <th className="py-3 font-semibold text-slate-400">Phone</th>
                      <th className="py-3 font-semibold text-slate-400">Role</th>
                      <th className="py-3 font-semibold text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResponse?.data?.map((user) => (
                      <tr key={user._id} className="border-b last:border-0 hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                        <td className="py-3 font-medium text-white">{user.name}</td>
                        <td className="py-3 text-slate-300">{user.email}</td>
                        <td className="py-3 text-slate-300">{user.phone}</td>
                        <td className="py-3 font-bold uppercase text-xs" style={{ color: user.role === 'admin' ? '#ef4444' : user.role === 'moderator' ? '#f59e0b' : '#3b82f6' }}>
                          {user.role}
                        </td>
                        <td className="py-3 text-right">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="p-1 rounded bg-slate-900 border text-xs"
                            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* SOS Center */}
        {activeTab === 'sos' && (
          <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Siren size={16} className="text-red-500 animate-pulse" />
              Incoming SOS Control Center
            </h3>

            <div className="space-y-3">
              {sosLoading ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Loading active SOS requests...
                </div>
              ) : sosRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No active SOS requests at this time.
                </div>
              ) : (
                sosRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl flex justify-between items-start flex-wrap gap-4 border animate-pulse"
                    style={{
                      borderColor: req.status === 'Resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      background: req.status === 'Resolved' ? 'rgba(16,185,129,0.02)' : 'rgba(239,68,68,0.03)',
                      animation: req.status === 'Pending' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                    }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">{req.name}</p>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: req.status === 'Resolved' ? 'rgba(16,185,129,0.2)' : req.status === 'Dispatched' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)',
                            color: req.status === 'Resolved' ? '#10b981' : req.status === 'Dispatched' ? '#3b82f6' : '#ef4444'
                          }}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Coords: {req.location}</p>
                      <p className="text-xs text-slate-400">Phone: {req.phone} · {req.time ? new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                    </div>

                    <div className="flex gap-2">
                      {req.status !== 'Resolved' && (
                        <>
                          {req.status === 'Pending' && (
                            <button
                              onClick={() => dispatchResponders(req.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Dispatch NDRF
                            </button>
                          )}
                          <button
                            onClick={() => resolveSOS(req.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
