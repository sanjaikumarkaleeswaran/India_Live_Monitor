"use client"

import RegisterPage from '@/features/auth/pages/RegisterPage'
import { PublicRoute } from '@/components/ui/ProtectedRoute'

export default function Register() {
  return (
    <PublicRoute>
      <RegisterPage />
    </PublicRoute>
  )
}
