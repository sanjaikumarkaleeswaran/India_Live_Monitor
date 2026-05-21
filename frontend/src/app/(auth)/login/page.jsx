"use client"

import LoginPage from '@/features/auth/pages/LoginPage'
import { PublicRoute } from '@/components/ui/ProtectedRoute'

export default function Login() {
  return (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  )
}
