"use client"

import AdminPage from '@/features/admin/pages/AdminPage'
import { AdminRoute } from '@/components/ui/ProtectedRoute'

export default function Admin() {
  return (
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  )
}
