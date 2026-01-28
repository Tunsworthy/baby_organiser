import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Use relative paths - no baseURL needed since user navigates to the domain
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
//update
// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh token
        const response = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        )

        const newAccessToken = response.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
