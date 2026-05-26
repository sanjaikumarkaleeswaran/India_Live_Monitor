import api from '../../../services/api'

export const getNotifications = async (page = 1, limit = 20) => {
  const response = await api.get('/notifications', { params: { page, limit } })
  return response.data
}

export const markAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`)
  return response.data
}

export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all')
  return response.data
}
