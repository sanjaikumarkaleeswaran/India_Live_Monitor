import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Wind, Search, AlertCircle, Heart, MapPin, Eye } from 'lucide-react'
import { getAQI } from '../services/aqiService'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { getAQILevel } from '../../../utils/formatters'

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad']

const AQIPage = () => {
  const [selectedCity, setSelectedCity] = useState('Delhi')

  // Fetch AQI data
  const { data: aqiData, isLoading, error } = useQuery({
    queryKey: ['aqi', selectedCity],
    queryFn: () => getAQI(selectedCity),
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🌬️ Air Quality Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  if (error || !aqiData) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Failed to load AQI data</h2>
        <p style={{ color: 'var(--text-muted)' }}>Could not establish connection with backend api.</p>
      </div>
    )
  }

  const aqiVal = aqiData.aqi
  const level = getAQILevel(aqiVal)

  // Specific health suggestions based on AQI Level
  const getHealthAdvisories = (aqi) => {
    if (aqi > 300) {
      return 'Critical: Severe health impacts for everyone. Remain indoors. Wear an N95/N99 respiratory mask if outdoors is absolutely necessary. Keep air purifiers running.'
    }
    if (aqi > 200) {
      return 'Poor: Vulnerable groups (children, elderly, asthmatics) should stay indoors. Healthy adults should reduce heavy outdoor activities. Keep windows closed.'
    }
    if (aqi > 100) {
      return 'Moderate: Sensitive individuals may experience minor breathing irritation. Consider reducing strenuous outdoor exercise.'
    }
    return 'Good: Excellent air quality. Perfectly safe to enjoy outdoor activities and exercise.'
  }

  const advisory = getHealthAdvisories(aqiVal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex justify-between items-center flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🌬️ Air Quality Monitor</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time PM2.5/PM10 density monitoring and local health advisories.
          </p>
        </div>

        {/* City Selector */}
        <div className="flex gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: selectedCity === city ? 'var(--accent-orange)' : 'var(--bg-card)',
                color: selectedCity === city ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main AQI Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-6 flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <span className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Current Air Quality</span>
            <h3 className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{aqiData.city}</h3>
            <p className="text-xs mt-1 text-slate-400">Last updated: {new Date(aqiData.time).toLocaleTimeString()}</p>
          </div>

          <div className="my-6 text-center">
            <span className="text-7xl font-black block" style={{ color: level.color }}>{aqiVal}</span>
            <span className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mt-2"
              style={{ background: level.bg, color: level.color }}>
              {level.label}
            </span>
          </div>

          <div className="h-2 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ background: level.color, width: `${Math.min((aqiVal / 500) * 100, 100)}%` }} />
          </div>
        </motion.div>

        {/* Pollutants Breakdown Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <span className="text-xs font-semibold text-slate-400">PM2.5 (Fine Dust)</span>
            <div>
              <p className="text-2xl font-bold mt-1 text-white">{aqiData.pm25 || '—'} <span className="text-xs font-normal text-slate-400">µg/m³</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">Primary health risk pollutant</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <span className="text-xs font-semibold text-slate-400">PM10 (Coarse Dust)</span>
            <div>
              <p className="text-2xl font-bold mt-1 text-white">{aqiData.pm10 || '—'} <span className="text-xs font-normal text-slate-400">µg/m³</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">Inhalable coarse particles</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <span className="text-xs font-semibold text-slate-400">Ozone (O3)</span>
            <div>
              <p className="text-2xl font-bold mt-1 text-white">{aqiData.o3 || '—'} <span className="text-xs font-normal text-slate-400">ppb</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">Secondary gaseous irritant</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <span className="text-xs font-semibold text-slate-400">Nitrogen Dioxide (NO2)</span>
            <div>
              <p className="text-2xl font-bold mt-1 text-white">{aqiData.no2 || '—'} <span className="text-xs font-normal text-slate-400">ppb</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">Combustion emission indicator</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Advisory & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="text-pink-400" size={18} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Health Recommendations</h3>
          </div>
          <p className="text-sm text-slate-300" style={{ lineHeight: '1.6' }}>{advisory}</p>
        </motion.div>

        <motion.div className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>National AQI Categories</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 text-emerald-400">
              <span>Good (0–50)</span>
              <span>Minimal Impact</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-green-500/10 text-green-400">
              <span>Satisfactory (51–100)</span>
              <span>Minor breathing discomfort</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-yellow-500/10 text-yellow-400">
              <span>Moderate (101–200)</span>
              <span>Discomfort for sensitive people</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-orange-500/10 text-orange-400">
              <span>Poor (201–300)</span>
              <span>Breathing discomfort on exposure</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-red-500/10 text-red-400">
              <span>Severe (&gt;400)</span>
              <span>Respiratory impact even on healthy</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AQIPage
