import { Navigate } from 'react-router-dom'
import { useAuth } from '@/compartilhado/gancho/useAutenticacao'
import { FullPageLoading } from '@/compartilhado/componente/Carregando'
import { Layout } from '@/compartilhado/moldura/Moldura'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <FullPageLoading />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Layout>{children}</Layout>
}
