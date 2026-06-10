"use client"

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Award, ShieldCheck, MapPin } from 'lucide-react'
import authService from '../../auth/services/authService'

const LeaderboardWidget = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: authService.getLeaderboard,
    refetchInterval: 5 * 60 * 1000,
  })

  const leaderboard = response?.data?.leaderboard || []

  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: 20, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4A6B8A', fontSize: 13 }}>Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <motion.div className="glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Award size={16} style={{ color: '#FFD700' }} />
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#E8F4FD' }}>Civic Leaderboard</h3>
      </div>
      
      {leaderboard.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,215,0,0.1)', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, color: '#4A6B8A' }}>No top citizens yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {leaderboard.map((user, idx) => (
            <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Rank Badge */}
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? 'rgba(255,215,0,0.2)' : idx === 1 ? 'rgba(192,192,192,0.2)' : idx === 2 ? 'rgba(205,127,50,0.2)' : 'rgba(0,229,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#8BAFD4', fontSize: 11, fontWeight: 800 }}>
                  #{idx + 1}
                </div>
                
                {/* User Info */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#E8F4FD' }}>{user.name.split(' ')[0]}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={9} style={{ color: '#4A6B8A' }} />
                    <span style={{ fontSize: 10, color: '#4A6B8A' }}>{user.city || user.state || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.trustScore}
                </span>
                <span style={{ fontSize: 9, color: '#8BAFD4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Karma
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default LeaderboardWidget
