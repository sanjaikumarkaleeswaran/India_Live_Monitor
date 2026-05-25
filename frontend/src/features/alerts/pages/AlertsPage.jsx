"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle2, Info, AlertCircle,
  MapPin, Clock, Filter, ShieldAlert, CloudLightning,
  Flame, Shield, HeartPulse, Zap, Navigation
} from 'lucide-react'
import { getAlerts } from '../services/alertService'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { formatTimeAgo } from '../../../utils/formatters'

const CATEGORY_ICONS = {
  weather: CloudLightning,
  fuel: Flame,
  crime: Shield,
  disaster: ShieldAlert,
  health: HeartPulse,
  utility: Zap,
  traffic: Navigation,
  other: Info
}

const SEVERITY_COLORS = {
  critical: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', icon: AlertTriangle },
  high:     { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400', icon: AlertCircle },
  medium:   { border: 'border-indigo-500/30', bg: 'bg-indigo-500/5', text: 'text-indigo-400', icon: Info },
  low:      { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', icon: CheckCircle2 },
}

const AlertsPage = () => {
  const [severityFilter, setSeverityFilter] = useState('all')

  const { data: alertsResponse, isLoading, error } = useQuery({
    queryKey: ['alerts', severityFilter],
    queryFn: () => getAlerts(severityFilter !== 'all' ? { severity: severityFilter } : {}),
  })

  const alerts = alertsResponse?.data || []

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-slate-100">National Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500">Failed to load alerts</h2>
        <p className="text-sm text-slate-500">Could not establish connection with backend api.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div className="flex justify-between items-end flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">National Alerts</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time civic warnings, crisis intel, and system notifications.
          </p>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <Filter size={14} className="text-slate-500 mx-2" />
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                severityFilter === f 
                  ? 'bg-white/10 text-slate-100 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
        <motion.div className="glass-card flex flex-col justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Active</span>
          <h3 className="text-2xl font-bold mt-2 text-slate-100">{alerts.length}</h3>
        </motion.div>
        
        <motion.div className="glass-card flex flex-col justify-between border-red-500/20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-red-400/70">Critical</span>
          <h3 className="text-2xl font-bold mt-2 text-red-400">{stats.critical}</h3>
        </motion.div>
        
        <motion.div className="glass-card flex flex-col justify-between border-orange-500/20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-orange-400/70">High Warning</span>
          <h3 className="text-2xl font-bold mt-2 text-orange-400">{stats.high}</h3>
        </motion.div>
        
        <motion.div className="glass-card flex flex-col justify-between border-indigo-500/20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400/70">Medium/Advisory</span>
          <h3 className="text-2xl font-bold mt-2 text-indigo-400">{stats.medium}</h3>
        </motion.div>
      </div>

      {/* Alerts List */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {alerts.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed">
            <CheckCircle2 size={32} className="text-emerald-500/50 mb-3" />
            <p className="text-sm font-medium text-slate-300">No active alerts found.</p>
            <p className="text-xs text-slate-500 mt-1">All systems and regions are currently reporting normal operations.</p>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const s = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium
            const Icon = s.icon
            const CategoryIcon = CATEGORY_ICONS[alert.category] || Info

            return (
              <motion.div 
                key={alert._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
                className={`p-4 rounded-lg border ${s.border} ${s.bg} flex flex-col sm:flex-row gap-4 sm:items-start group transition-colors hover:bg-white/[0.04]`}
              >
                {/* Left Icon */}
                <div className="mt-1 flex-shrink-0">
                  <Icon size={18} className={s.text} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-100">{alert.title}</h3>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.border} ${s.text}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] flex items-center gap-1 text-slate-500 capitalize px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      <CategoryIcon size={10} />
                      {alert.category}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed mb-3 pr-4">
                    {alert.description}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-600" />
                      {alert.affectedStates?.length > 0 ? alert.affectedStates.join(', ') : 'National'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-600" />
                      {formatTimeAgo(alert.createdAt)}
                    </div>
                    {alert.source && (
                      <div className="flex items-center gap-1.5 capitalize">
                        • {alert.source} Source
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}

export default AlertsPage
