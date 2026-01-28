import { create } from 'zustand'

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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false
      })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, firstName, lastName })
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()
      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false
      })
      return data
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
