import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import userService from '../services/userService'
import ErrorAlert from '../components/ErrorAlert'

export default function Profile() {
  const authUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [firstName, setFirstName] = useState(authUser?.firstName || '')
  const [lastName, setLastName] = useState(authUser?.lastName || '')
  const [email, setEmail] = useState(authUser?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let mounted = true
    async function fetchProfile() {
      try {
        const data = await userService.getProfile()
        if (!mounted) return
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.email || '')
      } catch (err) {
        // ignore - keep local auth values
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    try {
      const payload = { firstName, lastName, email }
      const updated = await userService.updateProfile(payload)

      // Update store and localStorage
      const newUser = {
        ...(authUser || {}),
        firstName: updated.firstName || firstName,
        lastName: updated.lastName || lastName,
        email: updated.email || email
      }
      setUser(newUser)
      try { localStorage.setItem('user', JSON.stringify(newUser)) } catch (e) {}

      setSuccess('Profile updated')
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to update profile'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Profile Settings</h1>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            placeholder="First name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Email"
            type="email"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
