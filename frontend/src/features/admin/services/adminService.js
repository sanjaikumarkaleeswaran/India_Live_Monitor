import api from '../../../services/api'

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params })
  return response.data
}

export const updateUserRole = async ({ userId, role }) => {
  const response = await api.put(`/users/${userId}/role`, { role })
  return response.data.data
}

export const getSystemHealth = async () => {
  const response = await api.get('/system/health')
  return response.data
}

