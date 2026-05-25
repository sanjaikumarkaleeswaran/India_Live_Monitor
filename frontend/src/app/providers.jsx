"use client"

import { useState, useEffect } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import { fetchCurrentUser, setInitialized } from '../features/auth/store/authSlice'

function AuthInitializer({ children }) {
  const dispatch = useDispatch()
  const accessToken = useSelector((s) => s.auth.accessToken)
  const isInitialized = useSelector((s) => s.auth.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      if (accessToken) {
        dispatch(fetchCurrentUser())
      } else {
        dispatch(setInitialized())
      }
    }
  }, [accessToken, isInitialized, dispatch])

  return children
}

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // 5 minutes
            gcTime: 10 * 60 * 1000,          // 10 minutes
            retry: 2,
            refetchOnWindowFocus: false,
            refetchInterval: 5 * 60 * 1000,  // Auto-refresh every 5 minutes
          },
        },
      })
  )

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d1b2e',
              color: '#f0f6ff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0d1b2e' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0d1b2e' },
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  )
}
