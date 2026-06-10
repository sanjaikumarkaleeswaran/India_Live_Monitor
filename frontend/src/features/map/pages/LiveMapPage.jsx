"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import {
  Siren, Hospital, ShieldAlert, Crosshair, HelpCircle,
  Layers, Activity, AlertTriangle, Radio, Satellite,
  Eye, EyeOff, RefreshCw, Camera
} from 'lucide-react'
import { getAlerts } from '../../alerts/services/alertService'
import { getEmergencyContacts, getNearbyHospitals, getNearbyPolice } from '../../emergency/services/emergencyService'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { useSelector } from 'react-redux'
import { selectUser } from '../../auth/store/authSlice'

const INDIA_CENTER = [22.5, 82.0]
const DEFAULT_ZOOM = 5

const severityColors = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#10b981',
}

const CCTV_FEEDS = [
  { id: 'cctv-1', name: 'MG Road Junction, Delhi', lat: 28.6139, lng: 77.2090, type: 'cctv', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 'cctv-2', name: 'NH48 Toll Plaza', lat: 28.5024, lng: 77.0868, type: 'cctv', url: 'https://images.unsplash.com/photo-1566418730999-1a6c42a22f30?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 'cctv-3', name: 'Marine Drive, Mumbai', lat: 18.9440, lng: 72.8225, type: 'cctv', url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6888f?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 'cctv-4', name: 'Anna Salai, Chennai', lat: 13.0604, lng: 80.2496, type: 'cctv', url: 'https://images.unsplash.com/photo-1506526615598-c62cb9842a1d?auto=format&fit=crop&q=80&w=400&h=250' }
]

// Custom Leaflet Icons
const getAlertIcon = (color) => L.divIcon({
  className: 'custom-alert-marker',
  html: `
    <div style="width: 48px; height: 48px; position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: 0; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: pulse-ring 2s infinite;"></div>
      <div style="position: relative; border-radius: 50%; width: 14px; height: 14px; background-color: ${color}; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 0 16px ${color}80, 0 0 0 4px ${color}30;"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24]
})

const getCenterIcon = (type, color) => {
  const iconHtml = renderToString(
    type === 'hospital' ? <Hospital size={12} color="#fff" /> : <ShieldAlert size={12} color="#fff" />
  )
  return L.divIcon({
    className: 'custom-center-marker',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 24px; height: 24px; background-color: ${color}; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 4px 12px ${color}60;">
        ${iconHtml}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}

const getCCTVIcon = () => {
  const iconHtml = renderToString(<Camera size={12} color="#000" />)
  return L.divIcon({
    className: 'custom-center-marker',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 24px; height: 24px; background-color: #fbbf24; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 4px 12px rgba(251, 191, 36, 0.6);">
        ${iconHtml}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

const FilterBtn = ({ active, color, icon: Icon, label, count, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className="w-full text-left rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
    style={{
      padding: '10px 12px',
      background: active ? `${color}15` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? `${color}50` : 'rgba(255,255,255,0.05)'}`,
      color: active ? color : '#8BAFD4',
    }}
  >
    <span className="flex items-center gap-2.5">
      {Icon && <Icon size={13} />}
      {label}
    </span>
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: active ? `${color}25` : 'rgba(255,255,255,0.05)',
        color: active ? color : '#4A6B8A',
        border: `1px solid ${active ? `${color}40` : 'transparent'}`,
      }}
    >
      {count}
    </span>
  </motion.button>
)

const ToggleBtn = ({ active, color, icon: Icon, label, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className="w-full flex items-center justify-between rounded-xl text-xs font-semibold transition-all"
    style={{
      padding: '9px 12px',
      background: active ? `${color}12` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
      color: active ? color : '#4A6B8A',
    }}
  >
    <span className="flex items-center gap-2">
      {Icon && <Icon size={12} />}
      {label}
    </span>
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
        color: active ? color : '#2A4B6A',
        border: `1px solid ${active ? `${color}40` : 'transparent'}`,
      }}
    >
      {active ? 'ON' : 'OFF'}
    </span>
  </motion.button>
)

const LiveMapPage = () => {
  const [filter, setFilter] = useState('all')
  const [showBoundaries, setShowBoundaries] = useState(true)
  const [indiaGeoJSON, setIndiaGeoJSON] = useState(null)
  
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const user = useSelector(selectUser)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarCollapsed(true)
    }
  }, [])

  useEffect(() => {
    if (user?.location?.coordinates) {
      setMapCenter([user.location.coordinates[1], user.location.coordinates[0]])
      setMapZoom(7)
    }
  }, [user])

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setIndiaGeoJSON(data) })
      .catch(() => {
        fetch('https://raw.githubusercontent.com/datameet/maps/master/Districts/india-districts.geojson')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setIndiaGeoJSON(data) })
          .catch(() => {})
      })
  }, [])

  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['mapAlerts'],
    queryFn: () => getAlerts({ limit: 50 }),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    staleTime: 20 * 1000,
  })

  const { data: hospitalsResponse, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['mapHospitals'],
    queryFn: () => getNearbyHospitals(20.5937, 78.9629, 3000),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  })

  const { data: policeResponse, isLoading: policeLoading } = useQuery({
    queryKey: ['mapPolice'],
    queryFn: () => getNearbyPolice(20.5937, 78.9629, 3000),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  })

  useEffect(() => {
    if (!alertsLoading) setLastUpdated(new Date())
  }, [alertsResponse, alertsLoading])

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['mapAlerts'] })
    await queryClient.invalidateQueries({ queryKey: ['mapHospitals'] })
    await queryClient.invalidateQueries({ queryKey: ['mapPolice'] })
    setLastUpdated(new Date())
    setTimeout(() => setIsRefreshing(false), 800)
  }, [queryClient])

  const alerts = alertsResponse?.data || []
  const safetyCenters = [
    ...(hospitalsResponse?.hospitals || []).map(h => ({ ...h, type: 'hospital', id: `h-${Math.random()}` })),
    ...(policeResponse?.stations || []).map(p => ({ ...p, type: 'police', id: `p-${Math.random()}` }))
  ]

  const displayedAlerts = filter === 'all' || filter === 'alerts' ? alerts : []
  const displayedCenters = filter === 'all' ? safetyCenters : safetyCenters.filter(c => c.type === filter)
  const displayedCCTV = (filter === 'all' || filter === 'cctv') ? CCTV_FEEDS : []

  const formattedTime = lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const handleRecenter = () => {
    if (user?.location?.coordinates) {
      setMapCenter([user.location.coordinates[1], user.location.coordinates[0]])
      setMapZoom(7)
    } else {
      setMapCenter(INDIA_CENTER)
      setMapZoom(DEFAULT_ZOOM)
    }
  }

  const isLoading = alertsLoading || hospitalsLoading || policeLoading

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live GIS Intelligence</h2>
            <p className="text-xs text-slate-500">Loading spatial data…</p>
          </div>
        </div>
        <SkeletonCard />
      </div>
    )
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Top Stats Bar ─────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {[
          { label: 'Active Alerts', value: alerts.length, color: '#ef4444', icon: Siren, glow: true },
          { label: 'Critical Zones', value: criticalCount, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Medical Centers', value: safetyCenters.filter(c => c.type === 'hospital').length, color: '#3b82f6', icon: Hospital },
          { label: 'CCTV Feeds', value: CCTV_FEEDS.length, color: '#fbbf24', icon: Camera },
        ].map(({ label, value, color, icon: Icon, glow }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.02 }}
            className="glass-card p-3 flex items-center gap-3 cursor-default"
            style={{ border: `1px solid ${color}20` }}
          >
            <div
              className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
                boxShadow: glow ? `0 0 12px ${color}30` : undefined,
              }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-black text-white leading-none mt-0.5">{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Layout ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 flex-1 min-h-0 md:h-[calc(100vh-280px)]" style={{ minHeight: 460 }}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              key="sidebar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 flex flex-col gap-3 overflow-hidden w-full md:w-[240px]"
            >
              <div className="glass-card p-4 flex flex-col gap-3 flex-1" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Layers size={13} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">Layer Controls</p>
                    <p className="text-[9px] text-slate-500">Filter map intelligence</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600 px-1">Data Layers</p>
                  <FilterBtn
                    active={filter === 'all'} color="#f97316" icon={null}
                    label="🌍  View All Layers" count={alerts.length + safetyCenters.length + CCTV_FEEDS.length}
                    onClick={() => setFilter('all')}
                  />
                  <FilterBtn
                    active={filter === 'alerts'} color="#ef4444" icon={Siren}
                    label="Live Active Alerts" count={alerts.length}
                    onClick={() => setFilter('alerts')}
                  />
                  <FilterBtn
                    active={filter === 'hospital'} color="#3b82f6" icon={Hospital}
                    label="Medical Centers" count={safetyCenters.filter(c => c.type === 'hospital').length}
                    onClick={() => setFilter('hospital')}
                  />
                  <FilterBtn
                    active={filter === 'police'} color="#10b981" icon={ShieldAlert}
                    label="Police Stations" count={safetyCenters.filter(c => c.type === 'police').length}
                    onClick={() => setFilter('police')}
                  />
                  <FilterBtn
                    active={filter === 'cctv'} color="#fbbf24" icon={Camera}
                    label="Live Traffic CCTV" count={CCTV_FEEDS.length}
                    onClick={() => setFilter('cctv')}
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600 px-1">Map Overlays</p>
                  <ToggleBtn active={showBoundaries} color="#00E5FF" icon={Layers} label="State Boundaries" onClick={() => setShowBoundaries(b => !b)} />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600 px-1">Alert Risk Levels</p>
                  <div className="space-y-1.5 px-1">
                    {[
                      { color: '#ef4444', label: 'Critical Danger Zone' },
                      { color: '#f59e0b', label: 'High Alert Sector' },
                      { color: '#6366f1', label: 'Medium Warning Region' },
                      { color: '#10b981', label: 'Low Watch Sector' },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
                        />
                        <span className="text-[10px] text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1">
                    <Radio size={10} className="text-emerald-400 shrink-0" />
                    <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Feed Active</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 px-1 mt-1.5">
                    <Satellite size={10} className="text-slate-500 shrink-0" />
                    <span className="text-[9px] text-slate-500 font-medium">ISRO SAT-C ● Synced</span>
                  </div>
                </div>
              </div>

              <div
                className="glass-card p-3"
                style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <p className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 mb-1.5">
                  <HelpCircle size={11} /> Citizen Notice
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Geospatial markers show live crisis zones, medical centres, and nearest emergency support relative to your coordinates.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Map Canvas ────────────────────────────────────────── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden min-w-0" id="map-canvas-outer"
          style={{
            border: '1px solid rgba(0,229,255,0.12)',
            boxShadow: '0 0 40px rgba(0,229,255,0.04)',
            minHeight: 400,
          }}
        >
          <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 pointer-events-none">
            <div className="glass-card px-3 py-1.5 flex items-center gap-2 pointer-events-auto w-full md:w-auto"
              style={{ background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.15)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider truncate">Live Intelligence Feed</span>
              <span className="text-[9px] text-slate-500">·</span>
              <span className="text-[9px] font-semibold text-cyan-400 whitespace-nowrap">{alerts.length} active</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto flex-wrap w-full md:w-auto justify-start md:justify-end">
              <motion.button
                onClick={() => setSidebarCollapsed(s => !s)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{ background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#8BAFD4' }}
              >
                {sidebarCollapsed ? <Eye size={12} /> : <EyeOff size={12} />}
                {sidebarCollapsed ? 'Show' : 'Hide'} Panel
              </motion.button>

              <motion.button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{ background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: isRefreshing ? '#00E5FF' : '#8BAFD4' }}
              >
                <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Syncing…' : formattedTime}
              </motion.button>

              <motion.button
                onClick={handleRecenter}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{ background: 'rgba(0,229,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }}
              >
                <Crosshair size={12} />
                Recenter
              </motion.button>
            </div>
          </div>

          {criticalCount > 0 && (
            <div className="absolute bottom-10 left-4 z-[1000] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.4)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400">{criticalCount} Critical Zone{criticalCount > 1 ? 's' : ''} Active</span>
              </motion.div>
            </div>
          )}

          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ width: '100%', height: '100%', background: '#04080F' }}
            zoomControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {showBoundaries && indiaGeoJSON && (
              <GeoJSON 
                data={indiaGeoJSON}
                style={{
                  color: '#00E5FF',
                  weight: 1,
                  opacity: 0.4,
                  dashArray: '4, 4',
                  fillColor: '#00E5FF',
                  fillOpacity: 0.02
                }}
              />
            )}

            {displayedAlerts.map(a => {
              let lat, lng;
              if (a.location?.coordinates?.length >= 2) {
                [lng, lat] = a.location.coordinates;
              } else if (a.lat !== undefined && a.lng !== undefined) {
                lat = a.lat; lng = a.lng;
              } else return null;

              const color = severityColors[a.severity] || severityColors.medium;
              
              // Define zone radius based on severity (in meters)
              const radiusMap = { critical: 400000, high: 250000, medium: 150000, low: 80000 };
              const zoneRadius = radiusMap[a.severity] || 150000;
              
              return (
                <React.Fragment key={`alert-${a._id}`}>
                  <Circle
                    center={[lat, lng]}
                    radius={zoneRadius}
                    pathOptions={{ 
                      color: color, 
                      fillColor: color, 
                      fillOpacity: 0.08, 
                      weight: 1,
                      dashArray: '4, 6'
                    }}
                  />
                  <Marker
                    position={[lat, lng]}
                    icon={getAlertIcon(color)}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 space-y-1.5" style={{ minWidth: 200 }}>
                        <span
                          className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full inline-block"
                          style={{ 
                            color: color, 
                            background: `${color}20`, 
                            border: `1px solid ${color}40` 
                          }}
                        >
                          {a.severity} alert
                        </span>
                        <h4>{a.title}</h4>
                        <p className="max-h-24 overflow-y-auto pr-1">{a.description}</p>
                        {a.affectedStates?.length > 0 && (
                          <p className="text-[10px] text-slate-500 pt-1 mt-1 border-t border-slate-700/50">
                            📍 {a.affectedStates.join(', ')}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

            {displayedCenters.map((c, idx) => {
              const color = c.type === 'hospital' ? '#3b82f6' : '#10b981';
              return (
                <Marker
                  key={c.id || idx}
                  position={[c.lat, c.lng]}
                  icon={getCenterIcon(c.type, color)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5" style={{ minWidth: 200 }}>
                      <span className="text-[9px] uppercase font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded inline-block">
                        {c.type === 'hospital' ? '🏥 Medical Centre' : '🛡️ Police HQ'}
                      </span>
                      <h4 className="mt-1">{c.name}</h4>
                      <p>
                        📞 <a href={`tel:${c.phone}`} className="font-bold text-blue-400 hover:text-blue-300">{c.phone}</a>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {displayedCCTV.map(c => (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={getCCTVIcon()}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-2" style={{ minWidth: 260 }}>
                    <span className="text-[9px] uppercase font-bold text-slate-900 bg-amber-400 px-1.5 py-0.5 rounded inline-block">
                      📹 Live Traffic Feed
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-white">{c.name}</h4>
                    <div className="rounded-lg overflow-hidden border border-slate-700 mt-2 relative shadow-lg">
                      <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-red-400 font-bold uppercase backdrop-blur-sm z-10">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> REC
                      </div>
                      <img src={c.url} alt="CCTV Feed" className="w-full h-32 object-cover opacity-90" />
                    </div>
                    <p className="text-[10px] text-slate-400">Stream encrypted • {new Date().toLocaleTimeString('en-IN')}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

export default LiveMapPage
