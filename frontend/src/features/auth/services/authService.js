import api from '../../../services/api'

/**
 * Auth API service — abstracts all auth-related HTTP calls
 */
const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    return res.data
  },

  logout: async () => {
    const res = await api.post('/auth/logout')
    return res.data
  },

  refreshToken: async () => {
    const res = await api.post('/auth/refresh-token')
    return res.data
  },

  getMe: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  },

  verifyEmail: async (token) => {
    const res = await api.post('/auth/verify-email', { token })
    return res.data
  },
}

export default authService
