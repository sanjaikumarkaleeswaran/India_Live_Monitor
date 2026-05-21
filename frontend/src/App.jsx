import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/ui/ProtectedRoute'
import { fetchCurrentUser } from './features/auth/store/authSlice'
import PageWrapper from './components/layout/PageWrapper'
import { SkeletonCard } from './components/ui/Skeleton'

// ── Lazy Loaded Pages ──────────────────────────────────────
const LoginPage     = lazy(() => import('./features/auth/pages/LoginPage'))
const RegisterPage  = lazy(() => import('./features/auth/pages/RegisterPage'))
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'))

// Placeholder pages for Phase 2+ (to be built incrementally)
const PlaceholderPage = ({ title, icon = '🚧', sub }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
    <div className="text-6xl">{icon}</div>
    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
    <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
      {sub || 'This module is being built. Stay tuned — it will be live in the next phase!'}
    </p>
    <div className="px-4 py-2 rounded-xl text-sm font-medium mt-2"
      style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>
      Coming in Phase {title === 'India Live Map' ? '4' : title.includes('Admin') ? '6' : '3'}
    </div>
  </div>
)

// Page-level suspense fallback
const PageLoader = () => (
  <div className="p-6 space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
    </div>
  </div>
)

// ── App Router ─────────────────────────────────────────────
const AppRouter = () => {
  const dispatch = useDispatch()
  const accessToken = useSelector((s) => s.auth.accessToken)
  const isInitialized = useSelector((s) => s.auth.isInitialized)

  // On app load, if we have a stored token, verify it with the server
  useEffect(() => {
    if (accessToken && !isInitialized) {
      dispatch(fetchCurrentUser())
    }
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Root redirect ── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Public routes (auth) ── */}
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute><RegisterPage /></PublicRoute>
          } />

          {/* ── Protected routes ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/map" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="India Live Map" icon="🗺️"
                  sub="Interactive GIS map with danger zones, hospitals, weather layers and live alerts — coming in Phase 4" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/fuel" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Fuel Price Monitor" icon="⛽"
                  sub="State-wise petrol & diesel prices, history charts, and AI fuel-saving recommendations — coming in Phase 2" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/weather" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Weather Monitor" icon="🌤️"
                  sub="Real-time temperature, rain alerts, cyclone tracking, heatwave warnings — coming in Phase 3" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/aqi" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Air Quality Monitor" icon="🌬️"
                  sub="City-wise AQI, pollution alerts, health warnings — coming in Phase 3" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/emergency" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Emergency Response" icon="🚨"
                  sub="SOS button, nearby hospitals, police stations, and national helplines — coming in Phase 5" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/safety" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Safety Monitor" icon="🛡️"
                  sub="Crime alerts, women safety routes, danger zone mapping — coming in Phase 5" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="Citizen Reports" icon="📋"
                  sub="Report local incidents, view community alerts, moderate crowd-sourced data — coming in Phase 6" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <PageWrapper>
                <PlaceholderPage title="My Profile" icon="👤"
                  sub="Account settings, preferences, and notification management" />
              </PageWrapper>
            </ProtectedRoute>
          } />

          {/* ── Admin routes ── */}
          <Route path="/admin" element={
            <AdminRoute>
              <PageWrapper>
                <PlaceholderPage title="Admin Panel" icon="⚙️"
                  sub="User management, alert broadcasting, analytics, and system monitoring — coming in Phase 6" />
              </PageWrapper>
            </AdminRoute>
          } />

          {/* ── 404 ── */}
          <Route path="*" element={
            <div className="min-h-screen bg-mesh flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-8xl font-black gradient-text">404</div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Page not found</h2>
                <p style={{ color: 'var(--text-muted)' }}>The page you're looking for doesn't exist.</p>
                <a href="/dashboard" className="btn btn-primary inline-flex mt-4">Back to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
