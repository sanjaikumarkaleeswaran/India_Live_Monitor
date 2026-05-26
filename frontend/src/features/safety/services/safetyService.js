import api from '../../../services/api'

export const evaluateSafetyRoute = async (waypoints) => {
  const response = await api.post('/safety/route', { waypoints })
  return response.data.data
}

export const getSafetyZones = async (city) => {
  const response = await api.get(`/safety/zones`, { params: { city } })
  return response.data.data
}
