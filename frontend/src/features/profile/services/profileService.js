import api from '../../../services/api'

export const updateProfile = async (userData) => {
  const response = await api.put('/users/me', userData)
  return response.data.data
}
