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
      const { user, accessToken } = data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      set({
        user,
        accessToken,
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
      const { user, accessToken } = data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      set({
        user,
        accessToken,
        isLoading: false
      })
      return data.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    set({ user: null, accessToken: null, error: null })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ accessToken: token, user })
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
        localStorage.removeItem('user')
      }
    }
  }
}))
