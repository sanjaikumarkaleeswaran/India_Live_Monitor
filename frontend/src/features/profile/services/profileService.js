import api from '../../../services/api'

export const updateProfile = async (userData) => {
  const response = await api.put('/users/me', userData)
  // backend returns { success, message, data: { user: {...} } }
  return response.data
}
