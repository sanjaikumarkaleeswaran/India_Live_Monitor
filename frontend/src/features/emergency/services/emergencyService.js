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

export const getNearbyPolice = async (lat, lng, radius) => {
  const response = await api.get('/emergency/police/nearby', {
    params: { lat, lng, radius }
  })
  return response.data.data
}

export const triggerSOS = async (sosData) => {
  const response = await api.post('/emergency/sos', sosData)
  return response.data.data
}

export const getSOSRequests = async () => {
  const response = await api.get('/emergency/sos')
  return response.data.data
}

export const updateSOSStatus = async ({ id, status }) => {
  const response = await api.put(`/emergency/sos/${id}/status`, { status })
  return response.data.data
}
