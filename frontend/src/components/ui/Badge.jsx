import { motion } from 'framer-motion'

/**
 * Badge — Status and category badge component
 */
const Badge = ({
  children,
  variant = 'info',   // info | success | warning | danger | neutral
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variants = {
    info:    'badge-info',
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-critical',
    neutral: 'bg-white/5 text-slate-400 border border-white/10',
  }

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  )
}

/**
 * LiveBadge — Animated "LIVE" indicator (SILM Command Center style)
 */
export const LiveBadge = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-bold ${className}`}
    style={{
      fontSize: 9,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#00FF88',
      background: 'rgba(0,255,136,0.08)',
      border: '1px solid rgba(0,255,136,0.2)',
      padding: '2px 7px',
      borderRadius: 20,
    }}
  >
    <span className="live-dot" style={{ width: 5, height: 5 }} />
    Live
  </span>
)

export default Badge
