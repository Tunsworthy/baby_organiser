import apiClient from './apiClient'

export const childService = {
  async getAll(groupId) {
    const response = await apiClient.get('/api/children', {
      params: groupId ? { groupId } : undefined
    })
    const data = response.data
    return Array.isArray(data) ? data : (data?.children || [])
  },

  async create(name) {
    const response = await apiClient.post('/api/children', { name })
    return response.data
  },

  async update(childId, name) {
    const response = await apiClient.patch(`/api/children/${childId}`, { name })
    return response.data
  },

  async remove(childId) {
    const response = await apiClient.delete(`/api/children/${childId}`)
    return response.data
  }
}
