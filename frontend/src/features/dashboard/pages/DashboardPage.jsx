import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  Fuel, Cloud, Wind, Siren, Shield, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Thermometer, Droplets, Activity,
  MapPin, Phone, ArrowUpRight,
} from 'lucide-react'
import { selectUser } from '../../auth/store/authSlice'
import { LiveBadge } from '../../../components/ui/Badge'
import { SkeletonStatCard } from '../../../components/ui/Skeleton'
import { formatCurrency, getAQILevel, formatTimeAgo } from '../../../utils/formatters'
import { EMERGENCY_NUMBERS } from '../../../utils/constants'

// ── Mock data (replaced by API data in Phase 3) ────────────
const MOCK_FUEL = [
  { city: 'Delhi',   petrol: 94.72, diesel: 87.62, change: +0.04 },
  { city: 'Mumbai',  petrol: 103.44, diesel: 89.97, change: -0.12 },
  { city: 'Chennai', petrol: 100.75, diesel: 92.46, change: +0.08 },
  { city: 'Kolkata', petrol: 104.95, diesel: 91.76, change: 0 },
  { city: 'Bengaluru', petrol: 101.94, diesel: 87.89, change: +0.05 },
]

const MOCK_AQI = [
  { city: 'Delhi',     aqi: 287, category: 'Poor' },
  { city: 'Mumbai',    aqi: 142, category: 'Moderate' },
  { city: 'Chennai',   aqi: 68,  category: 'Satisfactory' },
  { city: 'Kolkata',   aqi: 198, category: 'Moderate' },
  { city: 'Bengaluru', aqi: 84,  category: 'Satisfactory' },
]

const MOCK_ALERTS = [
  { id: 1, type: 'Cyclone Warning', location: 'Bay of Bengal', severity: 'critical', time: new Date(Date.now() - 18e5) },
  { id: 2, type: 'Heatwave Alert',  location: 'Rajasthan',    severity: 'high',     time: new Date(Date.now() - 72e5) },
  { id: 3, type: 'Flood Warning',   location: 'Assam',        severity: 'high',     time: new Date(Date.now() - 1e7) },
  { id: 4, type: 'Air Quality — Hazardous', location: 'Delhi NCR', severity: 'medium', time: new Date(Date.now() - 3e7) },
]

const MOCK_WEATHER = {
  city: 'Delhi', temp: 38, feelsLike: 41, humidity: 42, windSpeed: 14,
  condition: 'Clear Sky', icon: '☀️',
}

// ── Stat Card Component ────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, trend, delay = 0 }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    {/* Icon */}
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend > 0 ? 'text-red-400' : trend < 0 ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {trend !== 0 ? `${Math.abs(trend).toFixed(2)}` : 'Stable'}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  </motion.div>
)

// ── Alert Row ──────────────────────────────────────────────
const AlertRow = ({ alert }) => {
  const severityColors = {
    critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    high:     { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    medium:   { text: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
    low:      { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  }
  const s = severityColors[alert.severity] || severityColors.medium

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
      style={{ border: `1px solid ${s.border}`, background: s.bg }}>
      <AlertTriangle size={16} style={{ color: s.text, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{alert.type}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{alert.location}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ color: s.text, background: `${s.text}20` }}>
          {alert.severity}
        </span>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(alert.time)}</p>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
const DashboardPage = () => {
  const user = useSelector(selectUser)
  const avgPetrol = (MOCK_FUEL.reduce((s, f) => s + f.petrol, 0) / MOCK_FUEL.length).toFixed(2)
  const avgAQI = Math.round(MOCK_AQI.reduce((s, a) => s + a.aqi, 0) / MOCK_AQI.length)
  const aqiLevel = getAQILevel(avgAQI)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div className="flex items-start justify-between flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'Citizen'} 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Here's what's happening across India right now.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
          <Activity size={14} />
          <span className="font-medium">All systems operational</span>
          <LiveBadge />
        </div>
      </motion.div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Fuel} label="Avg. Petrol Price" value={`₹${avgPetrol}`}
          sub="National average today" color="#f97316" trend={0.04} delay={0.05} />
        <StatCard icon={Thermometer} label="Delhi Temperature" value={`${MOCK_WEATHER.temp}°C`}
          sub={`Feels like ${MOCK_WEATHER.feelsLike}°C · ${MOCK_WEATHER.condition}`}
          color="#6366f1" delay={0.1} />
        <StatCard icon={Wind} label="Avg. National AQI"
          value={avgAQI}
          sub={aqiLevel.label}
          color={aqiLevel.color} delay={0.15} />
        <StatCard icon={Siren} label="Active Alerts" value={MOCK_ALERTS.length}
          sub={`${MOCK_ALERTS.filter(a => a.severity === 'critical').length} critical`}
          color="#ef4444" delay={0.2} />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <motion.div className="glass-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Siren size={18} className="text-red-400" />
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Active Alerts</h3>
              <LiveBadge />
            </div>
            <button className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_ALERTS.map((a) => <AlertRow key={a.id} alert={a} />)}
          </div>
        </motion.div>

        {/* Emergency Helplines */}
        <motion.div className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} className="text-emerald-400" />
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Emergency Helplines</h3>
          </div>
          <div className="space-y-2">
            {EMERGENCY_NUMBERS.slice(0, 6).map((num) => (
              <a key={num.number} href={`tel:${num.number}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all group"
                style={{ border: '1px solid var(--border-subtle)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{num.name}</span>
                <span className="text-sm font-bold group-hover:text-orange-400 transition-colors"
                  style={{ color: num.color }}>{num.number}</span>
              </a>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs font-bold text-red-400">National Emergency</p>
            <p className="text-2xl font-black text-red-400">112</p>
          </div>
        </motion.div>
      </div>

      {/* ── Fuel + AQI Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Prices */}
        <motion.div className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fuel size={18} className="text-orange-400" />
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Fuel Prices Today</h3>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Per litre · ₹</span>
          </div>
          <div className="space-y-2">
            {MOCK_FUEL.map((f) => (
              <div key={f.city} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{f.city}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-orange-400">₹{f.petrol.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>₹{f.diesel.toFixed(2)}</span>
                  <span className={`text-xs font-medium ${f.change > 0 ? 'text-red-400' : f.change < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {f.change > 0 ? '+' : ''}{f.change !== 0 ? f.change.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Petrol</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />Diesel</span>
          </div>
        </motion.div>

        {/* AQI */}
        <motion.div className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <Wind size={18} className="text-blue-400" />
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>City AQI Monitor</h3>
          </div>
          <div className="space-y-3">
            {MOCK_AQI.map((a) => {
              const lvl = getAQILevel(a.aqi)
              const pct = Math.min((a.aqi / 500) * 100, 100)
              return (
                <div key={a.city}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{a.city}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: lvl.color }}>{a.aqi}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: lvl.color, width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="font-medium text-indigo-400 mb-1">⚕️ Health Advisory</p>
            <p style={{ color: 'var(--text-muted)' }}>Delhi air quality is Poor. Avoid outdoor activities. Wear N95 mask if going out.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage
