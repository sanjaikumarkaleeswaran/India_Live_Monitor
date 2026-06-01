import axios from 'axios'
import toast from 'react-hot-toast'

const isProd = process.env.NODE_ENV === 'production'
const API_BASE_URL = isProd 
  ? 'https://silm-backend.onrender.com' 
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000')

// Create the main axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly refresh token cookie
})

// ── Request Interceptor ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Read directly from localStorage to prevent circular import loop with store
    const token = typeof window !== 'undefined' ? localStorage.getItem('silm_token') : null
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response Interceptor (Token Refresh Logic) ─────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not an auth route and not already retried
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || 
                        originalRequest?.url?.includes('/auth/register') ||
                        originalRequest?.url?.includes('/auth/refresh-token')

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true },
        )
        const { accessToken } = response.data.data

        // Save token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('silm_token', accessToken)
        }

        // Dynamically import store to dispatch token update
        const { store } = await import('../app/store')
        const { setTokens } = await import('../features/auth/store/authSlice')
        store.dispatch(setTokens({ accessToken }))

        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Clear local token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('silm_token')
        }

        // Dynamically import store to dispatch logout
        try {
          const { store } = await import('../app/store')
          const { logout } = await import('../features/auth/store/authSlice')
          store.dispatch(logout())
        } catch (e) {
          console.error('Failed to dispatch logout in interceptor:', e)
        }

        toast.error('Session expired. Please login again.')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
