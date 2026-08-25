/**
 * Descobre quem está logado e oferece entrar, cadastrar e sair.
 *
 * Fica em App.tsx, envolvendo o app inteiro. As telas não falam com este
 * arquivo: elas chamam useAutenticacao().
 *
 * No modo demonstração não há servidor para conferir nada, então o visitante
 * já entra autenticado como um usuário fixo — e é por isso que, na prévia,
 * qualquer email e senha funcionam.
 */
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, modoDemonstracao } from '@/compartilhado/fonte/supabase'
import { ContextoDeAutenticacao } from '@/compartilhado/gancho/contextoDeAutenticacao'

const CHAVE_DA_SESSAO_DEMO = 'aurora-demo-session'

const visitanteDaDemonstracao = {
  id: 'demo-user',
  email: 'visitante@aurora.demo'
} as User

/**
 * Quem está logado na demonstração. Sai daqui já resolvido, e não de dentro de
 * um efeito, para a tela não precisar renderizar duas vezes só para descobrir
 * uma informação que já está no localStorage.
 */
function usuarioDaDemonstracao(): User | null {
  try {
    return localStorage.getItem(CHAVE_DA_SESSAO_DEMO) === 'out' ? null : visitanteDaDemonstracao
  } catch {
    // Navegador sem localStorage: mantém a sessão de demonstração
    return visitanteDaDemonstracao
  }
}

function gravarSessaoDemo(estado: 'in' | 'out') {
  try {
    localStorage.setItem(CHAVE_DA_SESSAO_DEMO, estado)
  } catch {
    // Sem localStorage a sessão vale só até recarregar a página — tudo bem
  }
}

export function ProvedorDeAutenticacao({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(() =>
    modoDemonstracao ? usuarioDaDemonstracao() : null
  )

  // Na demonstração a resposta já veio do localStorage; só o Supabase demora
  const [carregando, setCarregando] = useState(!modoDemonstracao)

  useEffect(() => {
    if (modoDemonstracao) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user || null)
      setCarregando(false)
    })

    // Mantém a tela em dia quando a sessão muda em outra aba ou expira
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user || null)
      setCarregando(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const entrar = async (email: string, senha: string) => {
    if (modoDemonstracao) {
      gravarSessaoDemo('in')
      setUsuario({ ...visitanteDaDemonstracao, email: email || visitanteDaDemonstracao.email } as User)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
  }

  const cadastrar = async (email: string, senha: string) => {
    if (modoDemonstracao) {
      gravarSessaoDemo('in')
      setUsuario({ ...visitanteDaDemonstracao, email: email || visitanteDaDemonstracao.email } as User)
      return
    }
    const { error } = await supabase.auth.signUp({ email, password: senha })
    if (error) throw error
  }

  const sair = async () => {
    if (modoDemonstracao) {
      gravarSessaoDemo('out')
      setUsuario(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <ContextoDeAutenticacao.Provider
      value={{ usuario, carregando, estaAutenticado: !!usuario, entrar, cadastrar, sair }}
    >
      {children}
    </ContextoDeAutenticacao.Provider>
  )
}
