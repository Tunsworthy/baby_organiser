import apiClient from './apiClient'

export const menuService = {
  getAll: async () => {
    const response = await apiClient.get('/api/menus')
    return response.data
  },

  getByDate: async (date) => {
    const response = await apiClient.get(`/api/menus/bydate/${date}`)
    return response.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/menus/${id}`)
    return response.data
  },

  createMenu: async (menuData) => {
    const response = await apiClient.post('/api/menus', menuData)
    return response.data
  },

  updateMenu: async (id, items) => {
    const response = await apiClient.put(`/api/menus/${id}`, { items })
    return response.data
  }
}
