import { create } from 'zustand'

export const useFoodStore = create((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchItems: async (accessToken) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }

      const data = await response.json()
      set({ items: data.items || data, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  addItem: async (itemData, accessToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(itemData)
      })

      if (!response.ok) {
        throw new Error('Failed to create item')
      }

      const newItem = await response.json()
      set((state) => ({
        items: [...state.items, newItem.item || newItem]
      }))
      return newItem
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  updateItem: async (itemId, itemData, accessToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(itemData)
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      const updated = await response.json()
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? (updated.item || updated) : item
        )
      }))
      return updated
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  deleteItem: async (itemId, accessToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId)
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  }
}))
