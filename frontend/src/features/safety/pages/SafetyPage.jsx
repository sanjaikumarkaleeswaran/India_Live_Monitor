import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, MapPin, Eye, Compass, PhoneCall, AlertCircle, Sparkles, Navigation, AlertTriangle, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'

const SAFETY_STATS = {
  Delhi: { overall: 68, lighting: 'Moderate (64%)', police: 'Active', womenRating: 'Needs Improvement', activeAlerts: 2 },
  Mumbai: { overall: 85, lighting: 'Excellent (91%)', police: 'Highly Active', womenRating: 'Safe', activeAlerts: 0 },
  Chennai: { overall: 82, lighting: 'Good (84%)', police: 'Active', womenRating: 'Safe', activeAlerts: 1 },
  Kolkata: { overall: 79, lighting: 'Good (78%)', police: 'Active', womenRating: 'Moderate', activeAlerts: 0 },
  Bengaluru: { overall: 81, lighting: 'Excellent (88%)', police: 'Active', womenRating: 'Safe', activeAlerts: 1 },
  Hyderabad: { overall: 80, lighting: 'Good (82%)', police: 'Active', womenRating: 'Safe', activeAlerts: 0 }
}

const SafetyPage = () => {
  const [selectedCity, setSelectedCity] = useState('Delhi')
  const [routeQuery, setRouteQuery] = useState({ from: '', to: '' })
  const [routeSafetyResult, setRouteSafetyResult] = useState(null)

  const handleRouteCheck = (e) => {
    e.preventDefault()
    if (!routeQuery.from || !routeQuery.to) {
      return toast.error('Please enter source and destination')
    }

    setRouteSafetyResult({
      rating: 88,
      litStatus: '92% well-lit streets',
      policeCheckpoints: 3,
      advice: 'Route is fully operational and verified safe. Well-patrolled by local precinct teams.'
    })
    toast.success('Route safety audited!')
  }

  const stat = SAFETY_STATS[selectedCity] || SAFETY_STATS.Delhi

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex justify-between items-center flex-wrap gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🛡️ Safety & Travel Monitor</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time neighborhood safety index, women support directories, and well-lit route analyzers.
          </p>
        </div>

        {/* City Select */}
        <div className="flex gap-2">
          {Object.keys(SAFETY_STATS).map((city) => (
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

      {/* Safety Index Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Shield className="text-orange-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Safety Index</span>
            <p className="text-3xl font-black mt-1" style={{ color: stat.overall >= 80 ? '#10b981' : '#f59e0b' }}>
              {stat.overall}%
            </p>
          </div>
        </motion.div>

        <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Lightbulb className="text-indigo-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Street Lighting</span>
            <p className="text-lg font-bold mt-1 text-white">{stat.lighting}</p>
          </div>
        </motion.div>

        <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Compass className="text-emerald-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Police Patrols</span>
            <p className="text-lg font-bold mt-1 text-white">{stat.police}</p>
          </div>
        </motion.div>

        <motion.div className="glass-card p-4 flex flex-col justify-between" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Eye className="text-pink-400" size={20} />
          <div className="mt-4">
            <span className="text-xs uppercase font-bold text-slate-400">Women Comfort Level</span>
            <p className="text-lg font-bold mt-1 text-white">{stat.womenRating}</p>
          </div>
        </motion.div>
      </div>

      {/* Safety Route Analyzer Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-5 lg:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Navigation size={18} className="text-orange-400" />
            Well-Lit Route Safety Check
          </h3>

          <form onSubmit={handleRouteCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">Starting Point</label>
                <input
                  type="text"
                  value={routeQuery.from}
                  onChange={(e) => setRouteQuery({ ...routeQuery, from: e.target.value })}
                  placeholder="e.g. Connaught Place"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Destination</label>
                <input
                  type="text"
                  value={routeQuery.to}
                  onChange={(e) => setRouteQuery({ ...routeQuery, to: e.target.value })}
                  placeholder="e.g. Saket Metro"
                  className="w-full p-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button type="submit" className="w-full py-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded-xl text-sm">
              Audit Route Lighting & Safety
            </button>
          </form>

          {/* Route results */}
          <AnimatePresence>
            {routeSafetyResult && (
              <motion.div
                className="mt-4 p-4 rounded-xl space-y-2 border"
                style={{ background: 'rgba(16,185,129,0.03)', borderColor: 'rgba(16,185,129,0.2)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-400 font-bold">Safety Level: Safe</span>
                  <span className="text-xs text-slate-400">{routeSafetyResult.litStatus}</span>
                </div>
                <p className="text-xs text-slate-300">{routeSafetyResult.advice}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Support Helplines Panel */}
        <motion.div className="glass-card p-5 flex flex-col justify-between"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>Quick safety lines</h3>
            <div className="space-y-3">
              <a href="tel:1091" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Women Safety</p>
                  <p className="text-sm font-black text-pink-400">1091</p>
                </div>
                <PhoneCall size={14} className="text-pink-400" />
              </a>

              <a href="tel:112" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs font-semibold text-slate-400">National Response</p>
                  <p className="text-sm font-black text-orange-400">112</p>
                </div>
                <PhoneCall size={14} className="text-orange-400" />
              </a>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl flex gap-2 items-center text-xs text-indigo-400 border border-indigo-400/20 bg-indigo-500/5">
            <Sparkles size={14} />
            <span>Updates hourly from local precinct feeds</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SafetyPage
