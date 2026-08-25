/**
 * O contrato da autenticação: o que o provedor entrega e o que as telas podem
 * usar.
 *
 * Fica separado do provedor e do gancho porque os três têm naturezas
 * diferentes — este é só um tipo e um contexto, sem componente e sem JSX.
 * Quem usa no dia a dia é o [useAutenticacao].
 */
import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type Autenticacao = {
  /** Usuário logado, ou null quando ninguém entrou */
  usuario: User | null
  /** Verdadeiro enquanto ainda não sabemos se existe sessão */
  carregando: boolean
  estaAutenticado: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

/**
 * Começa indefinido de propósito: assim o gancho consegue distinguir "ninguém
 * logado" de "esqueceram de montar o provedor" e avisar com uma mensagem util.
 */
export const ContextoDeAutenticacao = createContext<Autenticacao | undefined>(undefined)
