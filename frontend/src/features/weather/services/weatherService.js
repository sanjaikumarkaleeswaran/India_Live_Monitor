import api from '../../../services/api'

export const getWeather = async (city) => {
  const response = await api.get('/weather', { params: { city } })
  return response.data.data
}
