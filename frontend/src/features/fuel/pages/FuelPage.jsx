"use client"

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Fuel, Search, ArrowUpDown, TrendingUp, TrendingDown,
  Info, Compass, Award, Lightbulb, MapPin, Check
} from 'lucide-react'
import { getFuelPrices, getFuelHistory } from '../services/fuelService'
import { SkeletonCard, SkeletonTable } from '../../../components/ui/Skeleton'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { selectUser } from '../../auth/store/authSlice'

const FuelPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('stateName')
  const [sortOrder, setSortOrder] = useState('asc')
  const user = useSelector(selectUser)
  const [selectedState1, setSelectedState1] = useState('DL') 
  const [selectedState2, setSelectedState2] = useState('MH') // Default: Maharashtra

  // Fetch live fuel prices from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['fuelPrices'],
    queryFn: getFuelPrices,
  })

  // Fetch fuel history for selected state
  const { data: historyData } = useQuery({
    queryKey: ['fuelHistory', selectedState1],
    queryFn: () => getFuelHistory(selectedState1),
    enabled: !!selectedState1,
  })

  // Initialize selectedState1 based on user's state name
  useEffect(() => {
    if (data?.prices && data.prices.length > 0) {
      if (user?.state) {
        const match = data.prices.find(p => 
          p.stateName.toLowerCase() === user.state.toLowerCase() || 
          p.stateCode.toLowerCase() === user.state.toLowerCase()
        )
        if (match) setSelectedState1(match.stateCode)
      }
    }
  }, [data, user?.state])

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

  const highestState = prices.reduce((max, current) => {
    const maxPetrol = max?.petrol?.price || max?.petrol || 0
    const currentPetrol = current?.petrol?.price || current?.petrol || 0
    return currentPetrol > maxPetrol ? current : max
  }, prices[0]) || { stateName: 'N/A', stateCode: 'N/A', petrol: 0, diesel: 0 }
  const highestPetrol = highestState?.petrol?.price || highestState?.petrol || 0
  const highestDiesel = highestState?.diesel?.price || highestState?.diesel || 0

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

  const chartData = historyData ? historyData.map(h => ({
    name: new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    Petrol: h.petrol,
    Diesel: h.diesel
  })) : []

  const fuelSavingTips = [
    { title: 'Maintain Inflation', desc: 'Keeping tires properly inflated can improve fuel mileage by up to 3%.', icon: Compass },
    { title: 'Drive Smoothly', desc: 'Avoid rapid acceleration and hard braking; it lowers mileage by 15-30% on highways.', icon: Award },
    { title: 'Reduce Idle Time', desc: 'Turn off your engine at long traffic lights (exceeding 15 seconds) to conserve fuel.', icon: Lightbulb },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>⛽ Fuel Price Monitor</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          State-wise retail fuel rates updated daily at 6:00 AM.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
        <motion.div className="glass-card flex flex-col justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Avg. Petrol Rate</span>
          <h3 className="text-2xl font-bold mt-2 text-slate-100">₹{summary.avgPetrol.toFixed(2)}</h3>
          <p className="text-xs mt-1 text-slate-500">Stable today</p>
        </motion.div>

        <motion.div className="glass-card flex flex-col justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Avg. Diesel Rate</span>
          <h3 className="text-2xl font-bold mt-2 text-slate-100">₹{summary.avgDiesel.toFixed(2)}</h3>
          <p className="text-xs mt-1 text-slate-500">Stable today</p>
        </motion.div>

        <motion.div className="glass-card flex flex-col justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Highest Fuel State</span>
          <h3 className="text-xl font-bold mt-2 text-slate-100">{highestState.stateName} ({highestState.stateCode})</h3>
          <p className="text-xs mt-1 text-red-400 truncate">Petrol: ₹{highestPetrol.toFixed(2)} · Diesel: ₹{highestDiesel.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* History & Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
        {/* Trend Chart */}
        <motion.div className="glass-card flex flex-col lg:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-sm text-slate-100">
              7-Day Trend: {state1Data?.stateName}
            </h3>
            <select
              value={selectedState1}
              onChange={(e) => setSelectedState1(e.target.value)}
              className="p-1.5 rounded bg-white/5 border border-white/10 text-xs text-slate-200 outline-none"
            >
              {prices.map((p) => (
                <option key={p.stateCode} value={p.stateCode} className="bg-black text-slate-200">{p.stateName}</option>
              ))}
            </select>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                <Line type="monotone" dataKey="Petrol" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Diesel" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* State Comparison Panel */}
        <motion.div className="glass-card flex flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-semibold text-sm text-slate-100 mb-4">Compare Prices</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1.5">State A</label>
                <select
                  value={selectedState1}
                  onChange={(e) => setSelectedState1(e.target.value)}
                  className="w-full p-2 rounded bg-white/5 border border-white/10 text-xs text-slate-200 outline-none truncate"
                >
                  {prices.map((p) => (
                    <option key={p.stateCode} value={p.stateCode} className="bg-black text-slate-200">{p.stateName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1.5">State B</label>
                <select
                  value={selectedState2}
                  onChange={(e) => setSelectedState2(e.target.value)}
                  className="w-full p-2 rounded bg-white/5 border border-white/10 text-xs text-slate-200 outline-none truncate"
                >
                  {prices.map((p) => (
                    <option key={p.stateCode} value={p.stateCode} className="bg-black text-slate-200">{p.stateName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">Petrol Diff</p>
                <div className="flex justify-between items-end">
                  <div className="truncate pr-2">
                    <p className="text-xs text-slate-400 truncate">{state1Data?.stateName}</p>
                    <p className="text-base font-bold text-slate-100">₹{(state1Data?.petrol?.price || state1Data?.petrol || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right pl-2 border-l border-white/5">
                    <p className="text-xs text-slate-400 truncate">{state2Data?.stateName}</p>
                    <p className="text-base font-bold text-slate-100">₹{(state2Data?.petrol?.price || state2Data?.petrol || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-center text-[10px] mt-2 border-t border-white/5 pt-1.5 text-slate-500">
                  Difference: <span className="font-semibold text-slate-300">₹{Math.abs((state1Data?.petrol?.price || state1Data?.petrol || 0) - (state2Data?.petrol?.price || state2Data?.petrol || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Diesel Diff</p>
                <div className="flex justify-between items-end">
                  <div className="truncate pr-2">
                    <p className="text-xs text-slate-400 truncate">{state1Data?.stateName}</p>
                    <p className="text-base font-bold text-slate-100">₹{(state1Data?.diesel?.price || state1Data?.diesel || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right pl-2 border-l border-white/5">
                    <p className="text-xs text-slate-400 truncate">{state2Data?.stateName}</p>
                    <p className="text-base font-bold text-slate-100">₹{(state2Data?.diesel?.price || state2Data?.diesel || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-center text-[10px] mt-2 border-t border-white/5 pt-1.5 text-slate-500">
                  Difference: <span className="font-semibold text-slate-300">₹{Math.abs((state1Data?.diesel?.price || state1Data?.diesel || 0) - (state2Data?.diesel?.price || state2Data?.diesel || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main State-wise Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
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
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="glass-card flex flex-col">
            <h3 className="font-semibold text-sm text-slate-100 mb-4 flex items-center gap-2">
              <Lightbulb className="text-yellow-400" size={16} />
              Driving Tips
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {fuelSavingTips.map((tip, idx) => {
                const Icon = tip.icon
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded border border-white/5 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{tip.title}</p>
                      <p className="text-xs mt-0.5 text-slate-500">{tip.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card flex flex-col border-orange-500/20 bg-orange-500/5">
            <h4 className="font-semibold text-xs text-orange-400 mb-1 flex items-center gap-1.5"><Info size={12}/> Pricing Policy</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Under India's dynamic pricing model, oil marketing companies (OMCs) align domestic retail prices daily based on global crude indexes and currency rates.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default FuelPage
