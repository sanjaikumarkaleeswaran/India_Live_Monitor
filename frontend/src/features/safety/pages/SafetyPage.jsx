"use client"

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, MapPin, Eye, Compass, PhoneCall, Sparkles, Navigation, Lightbulb, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQuery } from '@tanstack/react-query'
import { selectUser } from '../../auth/store/authSlice'
import { evaluateSafetyRoute, getSafetyZones } from '../services/safetyService'

// City → Nominatim search region mapping for better geocoding accuracy
const CITY_VIEWBOXES = {
  Delhi:     [76.84, 28.40, 77.35, 28.88],
  Mumbai:    [72.77, 18.89, 72.99, 19.27],
  Chennai:   [80.18, 12.88, 80.32, 13.23],
  Kolkata:   [88.27, 22.45, 88.47, 22.65],
  Bengaluru: [77.46, 12.83, 77.75, 13.14],
  Hyderabad: [78.33, 17.28, 78.60, 17.55],
}

// Fallback city-center coordinates when geocoding fails
const CITY_CENTERS = {
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
}

/**
 * Geocode a place name using Nominatim (OpenStreetMap, free, no API key)
 * Returns { lat, lng } or null if not found
 */
const geocodePlace = async (placeName, city) => {
  const viewbox = CITY_VIEWBOXES[city]
  const viewboxParam = viewbox ? `&viewbox=${viewbox.join(',')}&bounded=1` : ''
  const query = placeName.includes(city) ? placeName : `${placeName}, ${city}, India`

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1${viewboxParam}&countrycodes=in`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    // Fallback: try without bounded viewbox
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${placeName}, India`)}&format=json&limit=1&countrycodes=in`
    const fallbackRes = await fetch(fallbackUrl, { headers: { 'Accept-Language': 'en' } })
    const fallbackData = await fallbackRes.json()
    if (fallbackData && fallbackData.length > 0) {
      return { lat: parseFloat(fallbackData[0].lat), lng: parseFloat(fallbackData[0].lon) }
    }
  } catch {
    // Network error — use city center
  }
  return null
}

const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Hyderabad']

// Risk level → display colour
const riskColor = (riskLevel) => {
  if (riskLevel === 'critical' || riskLevel === 'high') return '#ef4444'
  if (riskLevel === 'medium') return '#f59e0b'
  return '#10b981'
}

const SafetyPage = () => {
  const user = useSelector(selectUser)
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Delhi')
  const [routeQuery, setRouteQuery] = useState({ from: '', to: '' })
  const [routeSafetyResult, setRouteSafetyResult] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // ── Fetch live safety zones from backend ──────────────────
  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ['safetyZones', selectedCity],
    queryFn: () => getSafetyZones(selectedCity),
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  // Derive city stats from zone data (weighted average)
  const cityStats = (() => {
    const zones = zonesData?.zones || []
    if (zones.length === 0) return null
    const avg = (key) => Math.round(zones.reduce((s, z) => s + (z.factors?.[key] || 5), 0) / zones.length)
    const avgScore = Math.round(zones.reduce((s, z) => s + (z.score || 60), 0) / zones.length)
    const lighting = avg('lighting')
    const police = avg('policePresence')
    const incidents = Math.round(zones.reduce((s, z) => s + (z.factors?.recentIncidents || 5), 0) / zones.length)
    const highRiskCount = zones.filter(z => z.riskLevel === 'high').length
    return {
      overall: avgScore,
      lighting: lighting >= 8 ? `Excellent (${lighting * 10}%)` : lighting >= 6 ? `Good (${lighting * 10}%)` : `Moderate (${lighting * 10}%)`,
      police: police >= 8 ? 'Highly Active' : police >= 6 ? 'Active' : 'Limited Coverage',
      womenRating: avgScore >= 80 ? 'Safe' : avgScore >= 65 ? 'Moderate' : 'Needs Improvement',
      activeAlerts: incidents,
      highRiskZones: highRiskCount,
      zones,
    }
  })()

  // ── Route mutation ────────────────────────────────────────
  const evaluateRouteMutation = useMutation({
    mutationFn: evaluateSafetyRoute,
    onSuccess: (data) => {
      setRouteSafetyResult({
        rating: data.safetyScore,
        litStatus: data.isSafe ? 'Adequately lit streets' : 'Some unlit areas detected',
        advice: data.recommendations?.[0] || 'Stay alert on this route.',
        riskLevel: data.riskLevel,
        dangerPoints: data.dangerPoints || [],
      })
      toast.success('Route safety audited!')
    },
    onError: () => toast.error('Failed to audit route. Please try again.'),
  })

  // ── Form submit: geocode both places then call backend ────
  const handleRouteCheck = async (e) => {
    e.preventDefault()
    if (!routeQuery.from.trim() || !routeQuery.to.trim()) {
      return toast.error('Please enter source and destination')
    }

    setIsGeocoding(true)
    const toastId = toast.loading('Locating coordinates…')

    try {
      const [fromCoord, toCoord] = await Promise.all([
        geocodePlace(routeQuery.from, selectedCity),
        geocodePlace(routeQuery.to, selectedCity),
      ])

      // Use city center as fallback if geocoding fails
      const center = CITY_CENTERS[selectedCity] || { lat: 28.6139, lng: 77.2090 }
      const waypoints = [
        fromCoord || { lat: center.lat - 0.02, lng: center.lng - 0.02 },
        toCoord   || { lat: center.lat + 0.02, lng: center.lng + 0.02 },
      ]

      if (!fromCoord) toast(`"${routeQuery.from}" not found — using city centre as start`, { icon: '⚠️' })
      if (!toCoord)   toast(`"${routeQuery.to}" not found — using city centre as end`, { icon: '⚠️' })

      toast.dismiss(toastId)
      evaluateRouteMutation.mutate(waypoints)
    } catch {
      toast.dismiss(toastId)
      toast.error('Geocoding failed. Please check your inputs.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const isBusy = isGeocoding || evaluateRouteMutation.isPending

  // Stat cards use live data when available, fallback to reasonable defaults
  const displayStats = cityStats || {
    overall: 75,
    lighting: 'Loading…',
    police: 'Loading…',
    womenRating: 'Loading…',
    highRiskZones: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div className="flex justify-between items-start flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold text-white">🛡️ Safety & Travel Monitor</h2>
          <p className="text-sm mt-1 text-slate-400">
            Live neighbourhood safety index, well-lit route auditor, and women's support directory.
          </p>
        </div>

        {/* City Selector */}
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => { setSelectedCity(city); setRouteSafetyResult(null) }}
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

      {/* Safety Index Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 16 }}>
        {/* Overall Score */}
        <motion.div className="glass-card p-4 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Shield className="text-orange-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Safety Index</span>
            {zonesLoading ? (
              <div className="mt-2 h-8 w-16 rounded animate-pulse bg-white/10" />
            ) : (
              <p className="text-3xl font-black mt-1"
                style={{ color: displayStats.overall >= 80 ? '#10b981' : displayStats.overall >= 65 ? '#f59e0b' : '#ef4444' }}>
                {displayStats.overall}%
              </p>
            )}
            <p className="text-[10px] mt-1 text-slate-500">
              {zonesData?.zones?.length || 0} zones monitored
            </p>
          </div>
        </motion.div>

        {/* Street Lighting */}
        <motion.div className="glass-card p-4 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Lightbulb className="text-indigo-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Street Lighting</span>
            {zonesLoading ? (
              <div className="mt-2 h-5 w-28 rounded animate-pulse bg-white/10" />
            ) : (
              <p className="text-base font-bold mt-1 text-white">{displayStats.lighting}</p>
            )}
          </div>
        </motion.div>

        {/* Police Patrols */}
        <motion.div className="glass-card p-4 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Compass className="text-emerald-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Police Patrols</span>
            {zonesLoading ? (
              <div className="mt-2 h-5 w-24 rounded animate-pulse bg-white/10" />
            ) : (
              <p className="text-base font-bold mt-1 text-white">{displayStats.police}</p>
            )}
          </div>
        </motion.div>

        {/* Women Comfort */}
        <motion.div className="glass-card p-4 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Eye className="text-pink-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Women Comfort</span>
            {zonesLoading ? (
              <div className="mt-2 h-5 w-20 rounded animate-pulse bg-white/10" />
            ) : (
              <p className="text-base font-bold mt-1 text-white">{displayStats.womenRating}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Live Zone Details + Route Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>

        {/* Route Safety Checker */}
        <motion.div className="glass-card p-5 lg:col-span-2 flex flex-col gap-5"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-white">
              <Navigation size={18} className="text-orange-400" />
              Well-Lit Route Safety Check
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter place names — coordinates are resolved automatically via OpenStreetMap.
            </p>
          </div>

          <form onSubmit={handleRouteCheck} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  <MapPin size={11} className="inline mr-1 text-orange-400" />Starting Point
                </label>
                <input
                  type="text"
                  value={routeQuery.from}
                  onChange={(e) => setRouteQuery({ ...routeQuery, from: e.target.value })}
                  placeholder={`e.g. Connaught Place, ${selectedCity}`}
                  className="w-full p-2.5 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  disabled={isBusy}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  <MapPin size={11} className="inline mr-1 text-blue-400" />Destination
                </label>
                <input
                  type="text"
                  value={routeQuery.to}
                  onChange={(e) => setRouteQuery({ ...routeQuery, to: e.target.value })}
                  placeholder={`e.g. Saket Metro, ${selectedCity}`}
                  className="w-full p-2.5 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  disabled={isBusy}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: isBusy ? 'rgba(249,115,22,0.4)' : '#f97316',
                color: '#fff',
                cursor: isBusy ? 'not-allowed' : 'pointer',
              }}
            >
              {isBusy ? (
                <><Loader2 size={15} className="animate-spin" /> {isGeocoding ? 'Resolving coordinates…' : 'Analysing route…'}</>
              ) : (
                'Audit Route Lighting & Safety'
              )}
            </button>
          </form>

          {/* Route result */}
          <AnimatePresence>
            {routeSafetyResult && (
              <motion.div
                className="p-4 rounded-xl space-y-3 border"
                style={{
                  background: routeSafetyResult.riskLevel === 'high' || routeSafetyResult.riskLevel === 'critical'
                    ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                  borderColor: riskColor(routeSafetyResult.riskLevel) + '40',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {routeSafetyResult.riskLevel === 'low'
                      ? <CheckCircle2 size={16} className="text-emerald-400" />
                      : <AlertTriangle size={16} style={{ color: riskColor(routeSafetyResult.riskLevel) }} />
                    }
                    <span className="text-sm font-bold" style={{ color: riskColor(routeSafetyResult.riskLevel) }}>
                      {routeSafetyResult.riskLevel.toUpperCase()} RISK — Score: {routeSafetyResult.rating}/100
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{routeSafetyResult.litStatus}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{routeSafetyResult.advice}</p>
                {routeSafetyResult.dangerPoints?.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1.5">⚠ Caution Points</p>
                    {routeSafetyResult.dangerPoints.map((dp, i) => (
                      <p key={i} className="text-xs text-slate-400">• {dp.reason}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Zones list */}
          {!zonesLoading && cityStats?.zones?.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3">
                Monitored Zones in {selectedCity}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cityStats.zones.map((zone) => (
                  <div key={zone._id || zone.name}
                    className="flex items-center justify-between p-2.5 rounded-xl border"
                    style={{
                      background: `${riskColor(zone.riskLevel)}08`,
                      borderColor: `${riskColor(zone.riskLevel)}25`,
                    }}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{zone.name}</p>
                      <p className="text-[10px] text-slate-500">{zone.factors?.recentIncidents || 0} recent incidents</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{ color: riskColor(zone.riskLevel), background: `${riskColor(zone.riskLevel)}20` }}>
                      {zone.riskLevel?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Support Helplines Panel */}
        <motion.div className="glass-card p-5 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Quick Safety Lines</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Women Helpline', number: '1091', color: '#ec4899' },
                { label: 'National Emergency', number: '112', color: '#f97316' },
                { label: 'Police', number: '100', color: '#3b82f6' },
                { label: 'Ambulance', number: '102', color: '#10b981' },
              ].map(({ label, number, color }) => (
                <a key={number} href={`tel:${number}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all border group"
                  style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">{label}</p>
                    <p className="text-sm font-black" style={{ color }}>{number}</p>
                  </div>
                  <PhoneCall size={14} style={{ color }} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl flex gap-2 items-start text-xs text-indigo-400 border border-indigo-400/20 bg-indigo-500/5">
            <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">
              Zone safety data updates from local precinct records. Route coordinates are resolved in real-time via OpenStreetMap Nominatim.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SafetyPage
