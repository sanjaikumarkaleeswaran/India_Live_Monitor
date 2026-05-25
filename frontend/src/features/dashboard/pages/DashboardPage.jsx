"use client"

import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import {
  Fuel, Cloud, Wind, Siren, Shield, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Thermometer, Droplets, Activity,
  MapPin, Phone, ArrowUpRight,
} from 'lucide-react'
import { selectUser } from '../../auth/store/authSlice'
import { LiveBadge } from '../../../components/ui/Badge'
import { SkeletonStatCard, SkeletonCard } from '../../../components/ui/Skeleton'
import { formatCurrency, getAQILevel, formatTimeAgo } from '../../../utils/formatters'
import { getFuelPrices } from '../../fuel/services/fuelService'
import { getAlerts } from '../../alerts/services/alertService'
import { getEmergencyContacts } from '../../emergency/services/emergencyService'
import { getWeather } from '../../weather/services/weatherService'
import { getAQI } from '../../aqi/services/aqiService'


// ── Stat Card (SILM) ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, trend, delay = 0, href }) => (
  <motion.a
    href={href}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    whileHover={{ y: -2, boxShadow: `0 0 28px ${color}22, 0 4px 24px rgba(0,0,0,0.8)` }}
    style={{
      textDecoration: 'none',
      background: 'rgba(10,22,40,0.85)',
      border: `1px solid ${color}22`,
      borderRadius: 20, padding: 20,
      position: 'relative', overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: `0 4px 24px rgba(0,0,0,0.6)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${color}20`, flexShrink: 0 }}>
        <Icon size={16} style={{ color }} />
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: trend > 0 ? 'rgba(255,61,90,0.1)' : trend < 0 ? 'rgba(0,255,136,0.1)' : 'rgba(0,229,255,0.08)', color: trend > 0 ? '#FF8099' : trend < 0 ? '#00FF88' : '#00E5FF', border: `1px solid ${trend > 0 ? 'rgba(255,61,90,0.2)' : trend < 0 ? 'rgba(0,255,136,0.2)' : 'rgba(0,229,255,0.15)'}` }}>
          {trend > 0 ? <TrendingUp size={10} /> : trend < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
          {trend !== 0 ? Math.abs(trend).toFixed(2) : 'Stable'}
        </div>
      )}
    </div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A6B8A', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: '#E8F4FD', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#4A6B8A', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
    </div>
  </motion.a>
)

// ── Alert Row (SILM) ─────────────────────────────────────────
const AlertRow = ({ alert }) => {
  const sc = { critical: '#FF3D5A', high: '#FFB830', medium: '#7B61FF', low: '#00FF88' }
  const c = sc[alert.severity] || sc.medium
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${c}18`, background: `${c}06`, transition: 'all 0.2s' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AlertTriangle size={13} style={{ color: c }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#E8F4FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <MapPin size={10} style={{ color: '#4A6B8A' }} />
          <span style={{ fontSize: 11, color: '#4A6B8A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.affectedStates?.join(', ') || 'National'}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: c, background: `${c}18`, border: `1px solid ${c}30`, padding: '2px 8px', borderRadius: 20 }}>{alert.severity}</span>
        <p style={{ fontSize: 10, color: '#4A6B8A', marginTop: 4 }}>{formatTimeAgo(alert.createdAt)}</p>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
const DashboardPage = () => {
  const user = useSelector(selectUser)

  const { data: fuelData, isLoading: fuelLoading } = useQuery({ queryKey: ['fuelPrices'], queryFn: getFuelPrices })
  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({ queryKey: ['alerts'], queryFn: () => getAlerts({ limit: 4 }) })
  const { data: contactsData, isLoading: contactsLoading } = useQuery({ queryKey: ['emergencyContacts'], queryFn: () => getEmergencyContacts() })
  
  const defaultCity = user?.city || 'Delhi'
  const { data: weatherData, isLoading: weatherLoading } = useQuery({ queryKey: ['weather', defaultCity], queryFn: () => getWeather(defaultCity) })
  
  const fetchDashboardAqi = async () => {
    const cities = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru']
    const results = await Promise.all(cities.map(c => getAQI(c)))
    return results
  }
  const { data: aqiList, isLoading: aqiLoading } = useQuery({ queryKey: ['dashboardAqi'], queryFn: fetchDashboardAqi })

  const alerts = alertsResponse?.data || []
  const fuelList = fuelData?.prices?.slice(0, 5) || []
  const avgPetrol = fuelData?.summary?.avgPetrol || 101.50
  
  const currentTemp = weatherData?.temp ?? '--'
  const currentFeelsLike = weatherData?.feelsLike ?? '--'
  const currentAQIList = aqiList || []
  const avgAQI = currentAQIList.length > 0 ? Math.round(currentAQIList.reduce((s, a) => s + (a.aqi || 0), 0) / currentAQIList.length) : '--'
  const aqiLevel = getAQILevel(avgAQI !== '--' ? avgAQI : 0)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (fuelLoading || alertsLoading || contactsLoading || weatherLoading || aqiLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 20 }}>
          <div className="lg:col-span-2"><SkeletonCard /></div>
          <div><SkeletonCard /></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F4FD', letterSpacing: '-0.02em' }}>
            {greeting()},{' '}
            <span style={{ color: '#00E5FF', textShadow: '0 0 20px rgba(0,229,255,0.4)' }}>{user?.name?.split(' ')[0] || 'Operator'}</span>
          </h2>
          <p style={{ fontSize: 12, color: '#4A6B8A', marginTop: 4 }}>National command overview — all modules reporting live data.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 24, background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <Activity size={13} style={{ color: '#00FF88' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF88', letterSpacing: '0.06em' }}>System Operational</span>
          <LiveBadge />
        </div>
      </motion.div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard href="/fuel" icon={Fuel} label="Avg. Petrol Price" value={`₹${avgPetrol.toFixed(2)}`} sub="National average today" color="#FFB830" trend={0.00} delay={0.05} />
        <StatCard href="/weather" icon={Thermometer} label={`${defaultCity} Temperature`} value={`${currentTemp}°C`} sub={`Feels like ${currentFeelsLike}°C`} color="#7B61FF" delay={0.1} />
        <StatCard href="/aqi" icon={Wind} label="Avg. National AQI" value={avgAQI} sub={aqiLevel.label} color="#00E5FF" delay={0.15} />
        <StatCard href="/alerts" icon={Siren} label="Active Alerts" value={alerts.length} sub={`${alerts.filter(a => a.severity === 'critical').length} critical`} color="#FF3D5A" delay={0.2} />
      </div>

      {/* Alerts + Emergency */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 20 }}>
        <motion.div className="glass-card lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Siren size={15} style={{ color: '#FF3D5A', filter: 'drop-shadow(0 0 4px rgba(255,61,90,0.5))' }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD' }}>Active Alerts</h3>
              <LiveBadge />
            </div>
            <a href="/alerts" style={{ fontSize: 11, color: '#4A6B8A', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>View all <ArrowUpRight size={11} /></a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {alerts.length > 0 ? alerts.map(a => <AlertRow key={a._id} alert={a} />) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(0,229,255,0.1)', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 13, color: '#4A6B8A' }}>No active alerts reported.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Phone size={15} style={{ color: '#00E5FF' }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD' }}>Emergency Numbers</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {contactsData?.contacts?.slice(0, 5).map(num => (
                <a key={num.number} href={`tel:${num.number}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, border: '1px solid transparent', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <span style={{ fontSize: 12, color: '#8BAFD4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{num.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{num.number}</span>
                </a>
              ))}
            </div>
          </div>
          <a href="tel:112"
            style={{ marginTop: 16, display: 'block', borderRadius: 12, padding: '12px 0', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,61,90,0.2), rgba(255,61,90,0.1))', border: '1px solid rgba(255,61,90,0.3)', boxShadow: '0 0 20px rgba(255,61,90,0.12)', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(255,61,90,0.3)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(255,61,90,0.12)'}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FF8099' }}>National Emergency</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              <Phone size={14} style={{ color: '#FF3D5A' }} />
              <p style={{ fontSize: 22, fontWeight: 900, color: '#FF3D5A', fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 12px rgba(255,61,90,0.5)' }}>112</p>
            </div>
          </a>
        </motion.div>
      </div>

      {/* Fuel + AQI */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20 }}>
        <motion.div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Fuel size={15} style={{ color: '#FFB830' }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD' }}>Fuel Prices Today</h3>
            </div>
            <a href="/fuel" style={{ fontSize: 11, color: '#4A6B8A', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Compare <ArrowUpRight size={11} /></a>
          </div>
          <div style={{ flex: 1 }}>
            {fuelList.map((f, i) => (
              <div key={f.stateCode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < fuelList.length - 1 ? '1px solid rgba(0,229,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={11} style={{ color: '#4A6B8A' }} />
                  <span style={{ fontSize: 13, color: '#8BAFD4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{f.stateName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: '#FFB830' }}>₹{f.petrol?.price || f.petrol}</span>
                  <span style={{ color: '#4A6B8A' }}>₹{f.diesel?.price || f.diesel}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,229,255,0.06)', display: 'flex', gap: 16, fontSize: 11, color: '#4A6B8A' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB830', display: 'inline-block', boxShadow: '0 0 4px #FFB830' }} />Petrol</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A6B8A', display: 'inline-block' }} />Diesel</span>
          </div>
        </motion.div>

        <motion.div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Wind size={15} style={{ color: '#00E5FF' }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD' }}>City AQI Monitor</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {currentAQIList.map(a => {
              const lvl = getAQILevel(a.aqi)
              const pct = Math.min((a.aqi / 500) * 100, 100)
              return (
                <div key={a.city}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#8BAFD4' }}>{a.city}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: lvl.color, fontFamily: 'JetBrains Mono, monospace' }}>{a.aqi}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: lvl.color, background: `${lvl.color}15`, border: `1px solid ${lvl.color}30`, padding: '1px 6px', borderRadius: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lvl.label}</span>
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 999, background: 'rgba(0,229,255,0.06)' }}>
                    <motion.div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${lvl.color}80, ${lvl.color})`, width: 0, boxShadow: `0 0 6px ${lvl.color}60` }}
                      animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 12, background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.15)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#7B61FF', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={11} /> Health Advisory
            </p>
            <p style={{ fontSize: 11, color: '#8BAFD4', lineHeight: 1.6 }}>Delhi AQI is Poor. Avoid outdoor activities. Wear N95 mask if going out.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage
