import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoading } from './Loading'
import { Layout } from '../layout/Layout'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <FullPageLoading />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Layout>{children}</Layout>
}
