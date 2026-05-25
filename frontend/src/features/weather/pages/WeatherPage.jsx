"use client"

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud, Thermometer, Droplets, Wind, Search, AlertTriangle,
  Compass, Eye, ArrowUp, Umbrella, Shield
} from 'lucide-react'
import { getWeather } from '../services/weatherService'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { selectUser } from '../../auth/store/authSlice'

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad']

const WeatherPage = () => {
  const user = useSelector(selectUser)
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Delhi')

  // Fetch weather data for selected city
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather', selectedCity],
    queryFn: () => getWeather(selectedCity),
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🌤️ Weather Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Failed to load weather data</h2>
        <p style={{ color: 'var(--text-muted)' }}>Could not establish connection with backend api.</p>
      </div>
    )
  }

  // Severe alerts based on temperature
  const getSevereAlerts = (temp) => {
    if (temp >= 38) {
      return {
        title: 'Severe Heatwave Alert',
        desc: 'Temperatures exceeding 38°C. Avoid outdoor activity between 11 AM and 4 PM. Stay hydrated and check on vulnerable neighbors.',
        severity: 'high'
      }
    }
    if (temp < 10) {
      return {
        title: 'Cold Wave Warning',
        desc: 'Temperatures below normal. Keep warm and avoid prolonged outdoor exposure.',
        severity: 'medium'
      }
    }
    return null
  }

  const alert = getSevereAlerts(weather.temp)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div className="flex justify-between items-center flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">🌤️ Weather Monitor</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time meteorology stats and extreme weather alerts.
          </p>
        </div>

        {/* City Selector */}
        <div className="flex gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors border"
              style={{
                background: selectedCity === city ? 'var(--text-primary)' : 'var(--bg-surface)',
                color: selectedCity === city ? 'var(--bg-base)' : 'var(--text-secondary)',
                borderColor: selectedCity === city ? 'transparent' : 'var(--border-subtle)',
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Extreme Weather Alert */}
      {alert && (
        <motion.div
          className="p-4 rounded-lg flex gap-3 items-start border border-red-500/20 bg-red-500/10"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <h4 className="text-sm font-semibold text-red-400">{alert.title}</h4>
            <p className="text-xs mt-1 text-slate-300">{alert.desc}</p>
          </div>
        </motion.div>
      )}

      {/* Main Temperature Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        <motion.div className="glass-card flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Current Weather</span>
              <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Live</span>
            </div>
            <h3 className="text-2xl font-bold mt-3 text-slate-100">{weather.city}</h3>
            <p className="text-sm text-slate-400">{weather.condition}</p>
          </div>

          <div className="flex items-end justify-between mt-6">
            <span className="text-5xl font-black text-slate-100 tracking-tighter">{Math.round(weather.temp)}°C</span>
            <span className="text-5xl opacity-90">{weather.icon || '☀️'}</span>
          </div>
        </motion.div>

        {/* Dynamic weather indicators */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4" style={{ gap: 16 }}>
          <motion.div className="glass-card flex flex-col justify-between p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
              <Thermometer className="text-indigo-400" size={16} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Feels Like</span>
              <p className="text-lg font-bold mt-0.5 text-slate-200">{Math.round(weather.feelsLike)}°C</p>
            </div>
          </motion.div>

          <motion.div className="glass-card flex flex-col justify-between p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
              <Droplets className="text-blue-400" size={16} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Humidity</span>
              <p className="text-lg font-bold mt-0.5 text-slate-200">{weather.humidity}%</p>
            </div>
          </motion.div>

          <motion.div className="glass-card flex flex-col justify-between p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
              <Wind className="text-emerald-400" size={16} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Wind Speed</span>
              <p className="text-lg font-bold mt-0.5 text-slate-200">{weather.windSpeed} km/h</p>
            </div>
          </motion.div>

          <motion.div className="glass-card flex flex-col justify-between p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-pink-500/10 border border-pink-500/20">
              <Umbrella className="text-pink-400" size={16} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">UV Index</span>
              <p className="text-lg font-bold mt-0.5 text-slate-200">Moderate</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3-Day Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        <motion.div className="glass-card flex flex-col lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-semibold text-sm text-slate-100 mb-4">3-Day Regional Forecast</h3>
          <div className="divide-y divide-white/5 flex-1 flex flex-col">
            {weather.forecast && weather.forecast.length > 0 ? (
              weather.forecast.map((fc, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <span className="font-medium text-sm text-slate-300">{fc.day}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{fc.condition}</span>
                    <span className="font-bold text-sm text-slate-200">{fc.temp}°C</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg">
                <p className="text-sm text-slate-500">Forecast data temporarily unavailable.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Health Advisory */}
        <motion.div className="glass-card flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 mb-3 flex items-center gap-1.5"><Shield size={14} className="text-indigo-400" /> Advisory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Due to active high levels of summer radiation, citizens in {weather.city} are advised to avoid continuous exposure, remain hydrated, and drink natural cooling liquids (such as coconut water or buttermilk) periodically.
            </p>
          </div>
          <div className="mt-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">IMD Alert Level: yellow</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WeatherPage
