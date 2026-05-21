import axios from 'axios'
import { store } from '../app/store'
import { logout, setTokens } from '../features/auth/store/authSlice'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

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
    const token = store.getState().auth.accessToken
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
        store.dispatch(setTokens({ accessToken }))
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(logout())
        toast.error('Session expired. Please login again.')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle other errors gracefully
    const message = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) {
      // Let calling code handle the error message display
    }

    return Promise.reject(error)
  },
)

export default api
