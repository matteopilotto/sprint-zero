import { Navigate } from 'react-router-dom'
import { useSession } from './SessionProvider.jsx'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useSession()
  if (loading) return <p className="page-loading">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}
