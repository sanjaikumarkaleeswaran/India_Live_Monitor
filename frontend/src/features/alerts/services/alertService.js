import api from '../../../services/api'

export const getAlerts = async (params = {}) => {
  const response = await api.get('/alerts', { params })
  return response.data
}

export const getAlertById = async (id) => {
  const response = await api.get(`/alerts/${id}`)
  return response.data.data
}

export const createAlert = async (alertData) => {
  const response = await api.post('/alerts', alertData)
  return response.data.data
}
