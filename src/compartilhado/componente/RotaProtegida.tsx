/**
 * Porteiro das rotas: sem usuário logado, redireciona para /entrar.
 * Enquanto a sessão ainda está sendo verificada, mostra a tela de carregando
 * — sem isso a tela piscaria o login antes de reconhecer quem já entrou.
 */
import { Navigate } from 'react-router-dom'
import { useAutenticacao } from '@/compartilhado/gancho/useAutenticacao'
import { CarregandoPaginaInteira } from '@/compartilhado/componente/Carregando'
import { Moldura } from '@/compartilhado/moldura/Moldura'

export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, carregando } = useAutenticacao()

  if (carregando) return <CarregandoPaginaInteira />
  if (!estaAutenticado) return <Navigate to="/entrar" replace />

  return <Moldura>{children}</Moldura>
}
