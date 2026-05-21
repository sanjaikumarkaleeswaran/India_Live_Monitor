"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud, Thermometer, Droplets, Wind, Search, AlertTriangle,
  Compass, Eye, ArrowUp, Umbrella
} from 'lucide-react'
import { getWeather } from '../services/weatherService'
import { SkeletonCard } from '../../../components/ui/Skeleton'

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad']

const WeatherPage = () => {
  const [selectedCity, setSelectedCity] = useState('Delhi')

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex justify-between items-center flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🌤️ Weather Monitor</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time meteorology stats and extreme weather alerts.
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

      {/* Extreme Weather Alert */}
      {alert && (
        <motion.div
          className="p-4 rounded-2xl flex gap-3 items-start"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold text-red-400">{alert.title}</h4>
            <p className="text-xs mt-1 text-slate-300">{alert.desc}</p>
          </div>
        </motion.div>
      )}

      {/* Main Temperature Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-6 flex flex-col justify-between min-h-[220px]"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Current Weather</span>
              <span className="text-sm font-semibold text-emerald-400">Live</span>
            </div>
            <h3 className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>{weather.city}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{weather.condition}</p>
          </div>

          <div className="flex items-end justify-between mt-4">
            <span className="text-6xl font-black text-white">{Math.round(weather.temp)}°C</span>
            <span className="text-6xl">{weather.icon || '☀️'}</span>
          </div>
        </motion.div>

        {/* Dynamic weather indicators */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Thermometer className="text-indigo-400" size={20} />
            <div className="mt-4">
              <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Feels Like</span>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{Math.round(weather.feelsLike)}°C</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Droplets className="text-blue-400" size={20} />
            <div className="mt-4">
              <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Humidity</span>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{weather.humidity}%</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Wind className="text-emerald-400" size={20} />
            <div className="mt-4">
              <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Wind Speed</span>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{weather.windSpeed} km/h</p>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Umbrella className="text-pink-400" size={20} />
            <div className="mt-4">
              <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>UV Index</span>
              <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Moderate</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3-Day Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>3-Day Regional Forecast</h3>
          <div className="divide-y divide-white/5">
            {weather.forecast && weather.forecast.length > 0 ? (
              weather.forecast.map((fc, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{fc.day}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">{fc.condition}</span>
                    <span className="font-bold text-sm text-white">{fc.temp}°C</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>Forecast data temporarily unavailable.</p>
            )}
          </div>
        </motion.div>

        {/* AI Health Advisory */}
        <motion.div className="glass-card p-5 flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>⚕️ Environmental Advisory</h3>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Due to active high levels of summer radiation, citizens in {weather.city} are advised to avoid continuous exposure, remain hydrated, and drink natural cooling liquids (such as coconut water or buttermilk) periodically.
            </p>
          </div>
          <div className="mt-4 p-3 rounded-xl border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <p className="text-[11px] font-bold text-indigo-400">IMD Alert Level: yellow</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WeatherPage
