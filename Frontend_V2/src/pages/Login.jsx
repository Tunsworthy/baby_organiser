import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useForm } from 'react-hook-form'
import ErrorAlert from '../components/ErrorAlert'
import { useFormError } from '../hooks/useFormError'

export default function Login() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const { error, handleError, clearError } = useFormError()
  const login = useAuthStore((state) => state.login)
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  const onSubmit = async (data) => {
    setIsLoading(true)
    clearError()
    try {
      const result = await login(data.email, data.password)
      setUser(result.user)
      setAccessToken(result.accessToken)
      localStorage.setItem('accessToken', result.accessToken)
      navigate('/dashboard')
    } catch (err) {
      handleError(err, 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Baby Organiser</h1>

        {error && (
          <ErrorAlert message={error} onDismiss={clearError} className="mb-4" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  )
}
