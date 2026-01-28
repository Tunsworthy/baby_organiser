import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function PrivateRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}
