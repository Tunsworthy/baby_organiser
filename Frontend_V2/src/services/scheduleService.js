import apiClient from './apiClient'

export const scheduleService = {
  async listByChild(childId) {
    const response = await apiClient.get('/api/schedules', { params: { childId } })
    const data = response.data
    return Array.isArray(data) ? data : (data?.schedules || [])
  },

  async getById(scheduleId) {
    const response = await apiClient.get(`/api/schedules/${scheduleId}`)
    return response.data
  },

  async create({ childId, name, isActive }) {
    const response = await apiClient.post('/api/schedules', { childId, name, isActive })
    return response.data
  },

  async update(scheduleId, payload) {
    const response = await apiClient.put(`/api/schedules/${scheduleId}`, payload)
    return response.data
  },

  async activate(scheduleId) {
    const response = await apiClient.post(`/api/schedules/${scheduleId}/activate`)
    return response.data
  },

  async remove(scheduleId) {
    const response = await apiClient.delete(`/api/schedules/${scheduleId}`)
    return response.data
  },

  async copy(scheduleId, payload) {
    const response = await apiClient.post(`/api/schedules/${scheduleId}/copy`, payload)
    return response.data
  },

  async createItem(scheduleId, payload) {
    const response = await apiClient.post(`/api/schedules/${scheduleId}/items`, payload)
    return response.data
  },

  async updateItem(itemId, payload) {
    const response = await apiClient.patch(`/api/schedule-items/${itemId}`, payload)
    return response.data
  },

  async removeItem(itemId) {
    const response = await apiClient.delete(`/api/schedule-items/${itemId}`)
    return response.data
  }
}
