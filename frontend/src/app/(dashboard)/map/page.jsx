"use client"

import dynamic from 'next/dynamic'
import { PageLoader } from '@/components/ui/ProtectedRoute'

const LiveMapPage = dynamic(() => import('@/features/map/pages/LiveMapPage'), {
  ssr: false,
  loading: () => <PageLoader />,
})

export default function Map() {
  return <LiveMapPage />
}
