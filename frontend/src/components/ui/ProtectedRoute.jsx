"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectIsAdmin } from '../../features/auth/store/authSlice'
import { SkeletonCard } from './Skeleton'

// Page-level loader skeleton
export const PageLoader = () => (
  <div className="p-6 space-y-4 min-h-[60vh] flex flex-col justify-center">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
)

/**
 * ProtectedRoute — Guards routes behind authentication
 * Redirects to /login if not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isInitialized, router])

  if (!isInitialized || !isAuthenticated) {
    return <PageLoader />
  }

  return children
}

/**
 * AdminRoute — Guards routes behind admin role
 * Redirects to /dashboard if authenticated but not admin
 */
export const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isAdmin = useSelector(selectIsAdmin)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (!isAdmin) {
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, isAdmin, isInitialized, router])

  if (!isInitialized || !isAuthenticated || !isAdmin) {
    return <PageLoader />
  }

  return children
}

/**
 * PublicRoute — Redirects authenticated users away from login/register
 */
export const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector((s) => s.auth.isInitialized)
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  // If already authenticated or initializing, don't flash the public page
  if (!isInitialized || isAuthenticated) {
    return <PageLoader />
  }

  return children
}
