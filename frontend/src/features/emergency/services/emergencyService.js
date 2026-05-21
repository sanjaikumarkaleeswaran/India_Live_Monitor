import api from '../../../services/api'

export const getEmergencyContacts = async (category) => {
  const response = await api.get('/emergency/contacts', {
    params: { category }
  })
  return response.data.data
}

export const getNearbyHospitals = async (lat, lng, radius) => {
  const response = await api.get('/emergency/hospitals/nearby', {
    params: { lat, lng, radius }
  })
  return response.data.data
}

export const triggerSOS = async (sosData) => {
  const response = await api.post('/emergency/sos', sosData)
  return response.data.data
}
