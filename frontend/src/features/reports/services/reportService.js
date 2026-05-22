import api from '../../../services/api'

export const getReports = async (params) => {
  const response = await api.get('/reports', { params })
  return response.data.data
}

export const createReport = async (reportData) => {
  const response = await api.post('/reports', reportData)
  return response.data.data
}

export const verifyReport = async (id) => {
  const response = await api.post(`/reports/${id}/verify`)
  return response.data.data
}

export const flagReport = async (id) => {
  const response = await api.post(`/reports/${id}/flag`)
  return response.data.data
}

export const updateReportStatus = async ({ id, status }) => {
  const response = await api.put(`/reports/${id}/status`, { status })
  return response.data.data
}

export const deleteReport = async (id) => {
  const response = await api.delete(`/reports/${id}`)
  return response.data.data
}
