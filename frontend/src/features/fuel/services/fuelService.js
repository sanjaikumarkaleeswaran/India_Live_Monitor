import api from '../../../services/api'

export const getFuelPrices = async () => {
  const response = await api.get('/fuel')
  return response.data.data
}

export const getFuelPriceByState = async (stateCode) => {
  const response = await api.get(`/fuel/${stateCode}`)
  return response.data.data
}
