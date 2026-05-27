import api from '../../../services/api'

// ── User Management ────────────────────────────────────────
export const getUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params })
  return response.data
}

export const getUserStats = async () => {
  const response = await api.get('/admin/users/stats')
  return response.data
}

export const updateUserRole = async ({ userId, role }) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role })
  return response.data.data
}

export const toggleUserActive = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/toggle-active`)
  return response.data.data
}

// ── System Health ──────────────────────────────────────────
export const getSystemHealth = async () => {
  const response = await api.get('/admin/health')
  return response.data
}

// ── SOS Control ────────────────────────────────────────────
export const getAdminSOSList = async () => {
  const response = await api.get('/admin/sos')
  return response.data
}

export const updateAdminSOSStatus = async ({ id, status }) => {
  const response = await api.put(`/admin/sos/${id}/status`, { status })
  return response.data.data
}

// ── Alert Management ───────────────────────────────────────
export const getAllAlerts = async (params = {}) => {
  const response = await api.get('/admin/alerts', { params })
  return response.data
}

export const deactivateAlert = async (id) => {
  const response = await api.delete(`/admin/alerts/${id}`)
  return response.data
}
