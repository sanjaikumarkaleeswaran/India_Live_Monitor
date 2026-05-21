"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Fuel, Search, ArrowUpDown, TrendingUp, TrendingDown,
  Info, Compass, Award, Lightbulb, MapPin, Check
} from 'lucide-react'
import { getFuelPrices } from '../services/fuelService'
import { SkeletonCard, SkeletonTable } from '../../../components/ui/Skeleton'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// Generates 7-day mock history data for the chart based on current price
const generateHistoryData = (petrolPrice, dieselPrice) => {
  const dates = ['15 May', '16 May', '17 May', '18 May', '19 May', '20 May', '21 May']
  return dates.map((date, idx) => {
    const variance = (idx - 3) * 0.12 // slight upward trend
    return {
      name: date,
      Petrol: parseFloat((petrolPrice - 0.5 + variance + Math.random() * 0.1).toFixed(2)),
      Diesel: parseFloat((dieselPrice - 0.3 + variance + Math.random() * 0.08).toFixed(2)),
    }
  })
}

const FuelPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('stateName')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedState1, setSelectedState1] = useState('DL') // Default: Delhi
  const [selectedState2, setSelectedState2] = useState('MH') // Default: Maharashtra

  // Fetch live fuel prices from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['fuelPrices'],
    queryFn: getFuelPrices,
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>⛽ Fuel Price Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Failed to load fuel prices</h2>
        <p style={{ color: 'var(--text-muted)' }}>Could not establish connection with backend api.</p>
      </div>
    )
  }

  const prices = data?.prices || []
  const summary = data?.summary || { avgPetrol: 0, avgDiesel: 0 }

  // ── Handle Sorting ──
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filter and sort the state list
  const filteredPrices = prices
    .filter((p) =>
      p.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stateCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      // Extract values from nested petrol/diesel objects if sorting by prices
      if (sortField === 'petrol') {
        valA = a.petrol?.price || a.petrol
        valB = b.petrol?.price || b.petrol
      } else if (sortField === 'diesel') {
        valA = a.diesel?.price || a.diesel
        valB = b.diesel?.price || b.diesel
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  // Selected states for historical charts & comparison
  const state1Data = prices.find((p) => p.stateCode === selectedState1) || prices[0]
  const state2Data = prices.find((p) => p.stateCode === selectedState2) || prices[1]

  const chartData = generateHistoryData(
    state1Data?.petrol?.price || state1Data?.petrol || 95,
    state1Data?.diesel?.price || state1Data?.diesel || 87
  )

  const fuelSavingTips = [
    { title: 'Maintain Inflation', desc: 'Keeping tires properly inflated can improve fuel mileage by up to 3%.', icon: Compass },
    { title: 'Drive Smoothly', desc: 'Avoid rapid acceleration and hard braking; it lowers mileage by 15-30% on highways.', icon: Award },
    { title: 'Reduce Idle Time', desc: 'Turn off your engine at long traffic lights (exceeding 15 seconds) to conserve fuel.', icon: Lightbulb },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>⛽ Fuel Price Monitor</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          State-wise retail fuel rates updated daily at 6:00 AM.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Avg. Petrol Rate (India)</span>
          <h3 className="text-3xl font-black mt-2 text-orange-400">₹{summary.avgPetrol.toFixed(2)}</h3>
          <p className="text-xs mt-1 text-emerald-400">Stable today</p>
        </motion.div>

        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Avg. Diesel Rate (India)</span>
          <h3 className="text-3xl font-black mt-2 text-blue-400">₹{summary.avgDiesel.toFixed(2)}</h3>
          <p className="text-xs mt-1 text-emerald-400">Stable today</p>
        </motion.div>

        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Highest Fuel State</span>
          <h3 className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>Rajasthan (RJ)</h3>
          <p className="text-xs mt-1 text-red-400">Petrol: ₹108.97 · Diesel: ₹94.00</p>
        </motion.div>
      </div>

      {/* History & Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div className="glass-card p-5 lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              7-Day Trend: {state1Data?.stateName}
            </h3>
            <select
              value={selectedState1}
              onChange={(e) => setSelectedState1(e.target.value)}
              className="p-1.5 rounded-lg text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              {prices.map((p) => (
                <option key={p.stateCode} value={p.stateCode}>{p.stateName}</option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="Petrol" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Diesel" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* State Comparison Panel */}
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Compare Fuel Prices</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">State A</label>
                <select
                  value={selectedState1}
                  onChange={(e) => setSelectedState1(e.target.value)}
                  className="w-full p-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {prices.map((p) => (
                    <option key={p.stateCode} value={p.stateCode}>{p.stateName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">State B</label>
                <select
                  value={selectedState2}
                  onChange={(e) => setSelectedState2(e.target.value)}
                  className="w-full p-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {prices.map((p) => (
                    <option key={p.stateCode} value={p.stateCode}>{p.stateName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Details */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Petrol Price Difference</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{state1Data?.stateName}</p>
                    <p className="text-lg font-black">₹{(state1Data?.petrol?.price || state1Data?.petrol || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{state2Data?.stateName}</p>
                    <p className="text-lg font-black">₹{(state2Data?.petrol?.price || state2Data?.petrol || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-center text-xs mt-1 border-t pt-1" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  Difference: <span className="font-bold text-white">₹{Math.abs((state1Data?.petrol?.price || state1Data?.petrol || 0) - (state2Data?.petrol?.price || state2Data?.petrol || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Diesel Price Difference</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{state1Data?.stateName}</p>
                    <p className="text-lg font-black">₹{(state1Data?.diesel?.price || state1Data?.diesel || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{state2Data?.stateName}</p>
                    <p className="text-lg font-black">₹{(state2Data?.diesel?.price || state2Data?.diesel || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-center text-xs mt-1 border-t pt-1" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  Difference: <span className="font-bold text-white">₹{Math.abs((state1Data?.diesel?.price || state1Data?.diesel || 0) - (state2Data?.diesel?.price || state2Data?.diesel || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main State-wise Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Table */}
        <motion.div className="glass-card p-5 lg:col-span-2 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>State-wise Retail Prices</h3>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-sm w-48 transition-all focus:w-60"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort('stateName')}>
                    State Name <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="py-3 font-semibold cursor-pointer select-none text-right" onClick={() => handleSort('petrol')}>
                    Petrol (₹/L) <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="py-3 font-semibold cursor-pointer select-none text-right" onClick={() => handleSort('diesel')}>
                    Diesel (₹/L) <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((p) => {
                  const petrolPrice = p.petrol?.price !== undefined ? p.petrol.price : p.petrol
                  const dieselPrice = p.diesel?.price !== undefined ? p.diesel.price : p.diesel

                  return (
                    <tr key={p.stateCode} className="border-b last:border-0 hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                      <td className="py-3 font-medium flex items-center gap-2">
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{p.stateName}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-orange-400">₹{petrolPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-blue-400">₹{dieselPrice.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI/Eco Fuel Saving Tips */}
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="glass-card p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Lightbulb className="text-yellow-400" size={18} />
              AI Eco-Driving Tips
            </h3>
            <div className="space-y-4">
              {fuelSavingTips.map((tip, idx) => {
                const Icon = tip.icon
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)' }}>
                      <Icon size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tip.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tip.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card p-5" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <h4 className="font-bold text-sm text-orange-400 mb-1">📢 National Pricing Policy</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Under India's dynamic pricing model, oil marketing companies (OMCs) align domestic retail prices daily based on global crude indexes and currency rates.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default FuelPage
