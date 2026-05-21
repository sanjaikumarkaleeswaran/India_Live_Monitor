import api from '../../../services/api'

export const getAQI = async (city) => {
  const response = await api.get('/aqi', { params: { city } })
  return response.data.data
}
