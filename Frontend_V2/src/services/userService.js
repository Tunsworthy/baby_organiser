import apiClient from './apiClient'

export default {
  getProfile: async () => {
    const res = await apiClient.get('/api/auth/profile')
    return res.data
  },

  // Note: backend may not implement update yet. Expecting PUT /api/auth/profile
  updateProfile: async (payload) => {
    const res = await apiClient.put('/api/auth/profile', payload)
    return res.data
  }
}
