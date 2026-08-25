/**
 * Quem está logado, para qualquer tela.
 *
 *   const { usuario, estaAutenticado, sair } = useAutenticacao()
 *
 * Só funciona dentro do ProvedorDeAutenticacao, que fica em App.tsx e envolve
 * o app inteiro — se você ver o erro abaixo, foi ele que ficou de fora.
 */
import { useContext } from 'react'
import { ContextoDeAutenticacao } from '@/compartilhado/gancho/contextoDeAutenticacao'

export function useAutenticacao() {
  const contexto = useContext(ContextoDeAutenticacao)

  if (contexto === undefined) {
    throw new Error('useAutenticacao precisa estar dentro de um ProvedorDeAutenticacao')
  }

  return contexto
}
