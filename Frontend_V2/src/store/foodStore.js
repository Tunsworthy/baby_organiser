import { create } from 'zustand'
import apiClient from '../services/apiClient'

export const useFoodStore = create((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.get('/api/items')
      set({ items: data.data.items || data.data, isLoading: false })
      return data.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  addItem: async (itemData) => {
    try {
      const data = await apiClient.post('/api/items', itemData)
      set((state) => ({
        items: [...state.items, data.data.item || data.data]
      }))
      return data.data
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  updateItem: async (itemId, itemData) => {
    try {
      const data = await apiClient.patch(`/api/items/${itemId}`, itemData)
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? (data.data.item || data.data) : item
        )
      }))
      return data.data
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  deleteItem: async (itemId) => {
    try {
      await apiClient.delete(`/api/items/${itemId}`)
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId)
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  }
}))
