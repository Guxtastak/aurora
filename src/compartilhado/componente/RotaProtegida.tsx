import { Navigate } from 'react-router-dom'
import { useAutenticacao } from '@/compartilhado/gancho/useAutenticacao'
import { CarregandoPaginaInteira } from '@/compartilhado/componente/Carregando'
import { Moldura } from '@/compartilhado/moldura/Moldura'

export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAutenticacao()

  if (loading) return <CarregandoPaginaInteira />
  if (!isAuthenticated) return <Navigate to="/entrar" replace />

  return <Moldura>{children}</Moldura>
}
