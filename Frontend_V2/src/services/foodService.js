import apiClient from './apiClient'

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password })
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
    }
    return response.data
  },

  register: async (email, password, firstName, lastName) => {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      firstName,
      lastName
    })
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
    }
    return response.data
  },

  logout: () => {
    localStorage.removeItem('accessToken')
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile')
    return response.data
  },

  refreshToken: async () => {
    const response = await apiClient.post('/api/auth/refresh')
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
    }
    return response.data
  }
}

export const foodService = {
  getAllItems: async () => {
    const response = await apiClient.get('/api/items')
    return response.data
  },

  getItem: async (id) => {
    const response = await apiClient.get(`/api/items/${id}`)
    return response.data
  },

  createItem: async (itemData) => {
    const response = await apiClient.post('/api/items', itemData)
    return response.data
  },

  updateItem: async (id, itemData) => {
    const response = await apiClient.patch(`/api/items/${id}`, itemData)
    return response.data
  },

  deleteItem: async (id) => {
    const response = await apiClient.delete(`/api/items/${id}`)
    return response.data
  },

  deleteMultipleItems: async (ids) => {
    const response = await apiClient.post('/api/items/delete-multiple', { ids })
    return response.data
  }
}
