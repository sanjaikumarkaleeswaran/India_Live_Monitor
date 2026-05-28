"use client"

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud, Thermometer, Droplets, Wind, Search, AlertTriangle,
  Compass, Eye, ArrowUp, Umbrella, Shield
} from 'lucide-react'
import { getWeather, getWeatherForecast } from '../services/weatherService'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { selectUser } from '../../auth/store/authSlice'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const DEFAULT_CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad']

// Convert OpenWeather icon code to emoji
const iconToEmoji = (icon) => {
  if (!icon) return '🌤️'
  const map = {
    '01d': '☀️',  '01n': '🌕',
    '02d': '🌤️', '02n': '🌤️',
    '03d': '🌥️', '03n': '🌥️',
    '04d': '☁️',  '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌦️',
    '11d': '⛈️',  '11n': '⛈️',
    '13d': '❄️',  '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  }
  return map[icon] || '🌤️'
}

const WeatherPage = () => {
  const user = useSelector(selectUser)
  const userCity = user?.city
  const [selectedCity, setSelectedCity] = useState(userCity || 'Delhi')

  const citiesList = userCity && !DEFAULT_CITIES.includes(userCity) 
    ? [userCity, ...DEFAULT_CITIES] 
    : DEFAULT_CITIES

  // Fetch weather data for selected city — refreshes every 10 minutes
  const { data: weather, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['weather', selectedCity],
    queryFn: () => getWeather(selectedCity),
    refetchInterval: 10 * 60 * 1000,      // 10 minute auto-refresh
    refetchIntervalInBackground: true,
    staleTime: 8 * 60 * 1000,
  })

  // Fetch 7-day forecast — refreshes every 30 minutes
  const { data: forecastData } = useQuery({
    queryKey: ['weatherForecast', selectedCity],
    queryFn: () => getWeatherForecast(selectedCity),
    staleTime: 1000 * 60 * 25,
    refetchInterval: 30 * 60 * 1000,
  })

  const lastFetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'

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
        <div className="flex flex-wrap gap-2">
          {citiesList.map((city) => (
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
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500">Updated {lastFetchedAt}</span>
                <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Live</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-3 text-slate-100">{weather.city}</h3>
            <p className="text-sm text-slate-400">{weather.condition}</p>
          </div>

          <div className="flex items-end justify-between mt-6">
            <span className="text-5xl font-black text-slate-100 tracking-tighter">{Math.round(weather.temp)}°C</span>
            <span className="text-5xl opacity-90">{iconToEmoji(weather.icon)}</span>
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

      {/* Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        
        {/* Hourly Trend Chart */}
        <motion.div className="glass-card flex flex-col lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-100">24-Hour Temperature Trend</h3>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{selectedCity}</span>
          </div>
          <div className="h-48 mt-2 flex-1">
            {forecastData?.hourlyForecast && forecastData.hourlyForecast.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.hourlyForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#4A6B8A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    stroke="#4A6B8A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}°`}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }}
                    formatter={(v) => [`${v}°C`, 'Temp']}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#f59e0b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 h-full flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg">
                <p className="text-sm text-slate-500">Loading hourly forecast…</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div className="glass-card flex flex-col"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold text-sm text-slate-100 mb-4">7-Day Forecast</h3>
          <div className="divide-y divide-white/5 flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar">
            {forecastData?.forecast && forecastData.forecast.length > 0 ? (
              forecastData.forecast.map((fc, index) => (
                <div key={index} className="flex items-center justify-between py-2.5 gap-2">
                  <div className="w-10 shrink-0">
                    <p className="font-bold text-xs text-slate-200">{fc.day}</p>
                    <p className="text-[10px] text-slate-500">{fc.date}</p>
                  </div>
                  <span className="text-base">{iconToEmoji(fc.icon)}</span>
                  <span className="text-[10px] text-slate-400 flex-1 text-center truncate">{fc.condition}</span>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-xs text-slate-100">{fc.tempMax ?? fc.temp}°</p>
                    <p className="text-[10px] text-slate-500">{fc.tempMin ?? fc.temp - 4}°</p>
                  </div>
                </div>
              ))
            ) : weather?.forecast && weather.forecast.length > 0 ? (
              weather.forecast.map((fc, index) => (
                <div key={index} className="flex items-center justify-between py-2.5">
                  <span className="font-medium text-sm text-slate-300 w-10">{fc.day}</span>
                  <span className="text-xs text-slate-500 flex-1 truncate px-2 text-center">{fc.condition}</span>
                  <span className="font-bold text-sm text-slate-200">{fc.temp}°C</span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg">
                <p className="text-sm text-slate-500">Forecast data temporarily unavailable.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Health Advisory */}
      <div className="grid grid-cols-1" style={{ gap: 24 }}>
        <motion.div className="glass-card flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
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
