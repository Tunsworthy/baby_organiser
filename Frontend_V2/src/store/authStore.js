import { create } from 'zustand'
import apiClient from '../services/apiClient'

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.post('/api/auth/login', { email, password })
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isLoading: false
      })
      return data.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.post('/api/auth/register', { email, password, firstName, lastName })
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isLoading: false
      })
      return data.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  logout: () => set({ user: null, accessToken: null, error: null }),

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      set({ accessToken: token })
    }
  }
}))
