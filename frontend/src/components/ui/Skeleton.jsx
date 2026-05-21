/**
 * Skeleton — Shimmer loading placeholder components
 */
export const Skeleton = ({ className = '', width, height, circle = false }) => {
  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      className={`skeleton ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={style}
    />
  )
}

export const SkeletonCard = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton width={40} height={40} circle />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
    <Skeleton height={48} className="w-full" />
    <Skeleton height={12} className="w-2/3" />
  </div>
)

export const SkeletonStatCard = () => (
  <div className="stat-card space-y-3">
    <Skeleton height={12} className="w-1/2" />
    <Skeleton height={32} className="w-2/3" />
    <Skeleton height={10} className="w-1/3" />
  </div>
)

export const SkeletonRow = ({ cols = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
    {Array.from({ length: cols }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

export const SkeletonTable = () => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex justify-between items-center mb-4">
      <Skeleton height={20} className="w-1/3" />
      <Skeleton height={32} className="w-1/4" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
          <Skeleton height={14} className="w-1/4" />
          <Skeleton height={14} className="w-1/6" />
          <Skeleton height={14} className="w-1/6" />
        </div>
      ))}
    </div>
  </div>
)

export default Skeleton
