"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { Siren, Hospital, ShieldAlert, Crosshair, HelpCircle, Layers, ZoomIn } from 'lucide-react'
import L from 'leaflet'
import { getAlerts } from '../../alerts/services/alertService'
import { getEmergencyContacts, getNearbyHospitals, getNearbyPolice } from '../../emergency/services/emergencyService'
import { SkeletonCard } from '../../../components/ui/Skeleton'

// Fix Leaflet marker icon asset paths in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// India coordinates centering
const INDIA_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5

// Helper to create custom colored divIcon markers
const createCustomMarker = (color) => {
  return new L.DivIcon({
    html: `<span style="background-color: ${color}; width: 14px; height: 14px; display: block; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}"></span>`,
    className: 'custom-leaflet-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

// Marker categories custom SVGs
const severityColors = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#6366f1',
  low:      '#10b981',
}

const LiveMapPage = () => {
  const [filter, setFilter] = useState('all') // 'all', 'alerts', 'hospitals', 'police'
  const [mapInstance, setMapInstance] = useState(null)

  // Fetch live alerts
  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['mapAlerts'],
    queryFn: () => getAlerts({ limit: 50 }),
  })

  // Fetch live hospitals for the GIS map overlay
  const { data: hospitalsResponse, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['mapHospitals'],
    queryFn: () => getNearbyHospitals(20.5937, 78.9629, 3000), // National search centering on India
  })

  // Fetch live police stations for the GIS map overlay
  const { data: policeResponse, isLoading: policeLoading } = useQuery({
    queryKey: ['mapPolice'],
    queryFn: () => getNearbyPolice(20.5937, 78.9629, 3000), // National search centering on India
  })

  const alerts = alertsResponse?.data || []

  // Combine fetched resources into safetyCenters array
  const safetyCenters = [
    ...(hospitalsResponse?.hospitals || []).map(h => ({ ...h, type: 'hospital' })),
    ...(policeResponse?.stations || []).map(p => ({ ...p, type: 'police' }))
  ]

  // Filters calculation
  const displayedAlerts = filter === 'all' || filter === 'alerts' ? alerts : []
  const displayedCenters = filter === 'all'
    ? safetyCenters
    : safetyCenters.filter(c => c.type === filter)

  // Recenter to India helper
  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView(INDIA_CENTER, DEFAULT_ZOOM)
    }
  }

  const isLoading = alertsLoading || hospitalsLoading || policeLoading

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🗺️ Live GIS Danger Zone Map</h2>
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div className="flex justify-between items-center flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🗺️ Live GIS Danger Zone Map</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time geospatial intelligence overlay of crisis zones, hospitals, and police support.
          </p>
        </div>

        {/* Map Actions */}
        <button
          onClick={handleRecenter}
          className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/5 transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          <Crosshair size={14} />
          Reset View
        </button>
      </motion.div>

      {/* Control Panel Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: 24 }}>
        <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <motion.div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Layers size={16} className="text-orange-400" />
              Layer Controls
            </h3>
            
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setFilter('all')}
                className="w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
                style={{
                  background: filter === 'all' ? 'rgba(249,115,22,0.1)' : 'transparent',
                  border: `1px solid ${filter === 'all' ? 'rgba(249,115,22,0.3)' : 'var(--border-subtle)'}`,
                  color: filter === 'all' ? '#f97316' : 'var(--text-secondary)'
                }}
              >
                <span>🌍 View All Layers</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{alerts.length + safetyCenters.length}</span>
              </button>

              <button onClick={() => setFilter('alerts')}
                className="w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
                style={{
                  background: filter === 'alerts' ? 'rgba(239,68,68,0.1)' : 'transparent',
                  border: `1px solid ${filter === 'alerts' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                  color: filter === 'alerts' ? '#ef4444' : 'var(--text-secondary)'
                }}
              >
                <span className="flex items-center gap-2">
                  <Siren size={12} /> Live Active Alerts
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{alerts.length}</span>
              </button>

              <button onClick={() => setFilter('hospital')}
                className="w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
                style={{
                  background: filter === 'hospital' ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: `1px solid ${filter === 'hospital' ? 'rgba(59,130,246,0.3)' : 'var(--border-subtle)'}`,
                  color: filter === 'hospital' ? '#3b82f6' : 'var(--text-secondary)'
                }}
              >
                <span className="flex items-center gap-2">
                  <Hospital size={12} /> Trauma & Medical Centers
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                  {safetyCenters.filter(c => c.type === 'hospital').length}
                </span>
              </button>

              <button onClick={() => setFilter('police')}
                className="w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
                style={{
                  background: filter === 'police' ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: `1px solid ${filter === 'police' ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
                  color: filter === 'police' ? '#10b981' : 'var(--text-secondary)'
                }}
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert size={12} /> Police Stations
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                  {safetyCenters.filter(c => c.type === 'police').length}
                </span>
              </button>
            </div>

            {/* Severity Legend */}
            <div className="pt-4 border-t border-white/5" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted">Alert Risk Levels</p>
              <div className="text-xs text-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical Danger Zone</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High Alert Sector</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Medium Warning Region</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low Watch Sector</div>
              </div>
            </div>
          </motion.div>

          {/* Quick Notice Panel */}
          <div className="glass-card p-4 text-xs" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="font-bold text-indigo-400 flex items-center gap-1.5"><HelpCircle size={12} /> Citizen Notice</p>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
              Geospatial points display severe weather zones, cyclones, localized road-closures, and closest emergency contacts relative to coordinates.
            </p>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 h-[60vh] rounded-2xl overflow-hidden relative" style={{ border: '1px solid var(--border-subtle)' }}>
          <MapContainer
            center={INDIA_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ width: '100%', height: '100%', background: '#0e1626' }}
            ref={setMapInstance}
          >
            {/* Beautiful CartoDB Dark Matter tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Render Danger circles & labels for active alerts */}
            {displayedAlerts.map((a) => {
              // Ensure coordinates exist
              if (!a.location?.coordinates || a.location.coordinates.length < 2) return null
              const [lng, lat] = a.location.coordinates
              const color = severityColors[a.severity] || severityColors.medium

              return (
                <div key={a._id}>
                  {/* Danger circle overlay */}
                  <Circle
                    center={[lat, lng]}
                    radius={120000} // 120km circle radius
                    pathOptions={{ fillColor: color, fillOpacity: 0.15, color: color, weight: 1.5 }}
                  />
                  
                  {/* Core marker node */}
                  <Marker position={[lat, lng]} icon={createCustomMarker(color)}>
                    <Popup className="leaflet-dark-popup">
                      <div className="p-1 space-y-1">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block"
                          style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
                          {a.severity}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{a.title}</h4>
                        <p className="text-[11px] text-slate-300">{a.description}</p>
                        <p className="text-[10px] text-slate-500 pt-1">Target: {a.affectedStates?.join(', ')}</p>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              )
            })}

            {/* Render Safety Trauma / Hospital Checkpoints */}
            {displayedCenters.map((c, idx) => {
              const color = c.type === 'hospital' ? '#3b82f6' : '#10b981'
              return (
                <Marker key={idx} position={[c.lat, c.lng]} icon={createCustomMarker(color)}>
                  <Popup>
                    <div className="p-1 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded inline-block">
                        {c.type === 'hospital' ? '🏥 Hospital' : '🛡️ Police HQ'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{c.name}</h4>
                      <p className="text-xs text-slate-600">Contact: <a href={`tel:${c.phone}`} className="font-bold text-blue-600">{c.phone}</a></p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

export default LiveMapPage
