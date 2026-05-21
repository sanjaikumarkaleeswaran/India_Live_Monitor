"use client"

import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import PageWrapper from '@/components/layout/PageWrapper'

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <PageWrapper>
        {children}
      </PageWrapper>
    </ProtectedRoute>
  )
}
