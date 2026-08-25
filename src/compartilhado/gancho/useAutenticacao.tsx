/**
 * Quem é o usuário logado, e as ações de entrar, cadastrar e sair.
 *
 * O provedor fica em App.tsx e envolve o app inteiro; qualquer tela chama
 * useAutenticacao() para saber do usuário. No modo demonstração ele finge um
 * visitante fixo, e por isso qualquer email e senha entram.
 */
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, modoDemonstracao } from '@/compartilhado/fonte/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  carregando: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const ContextoDeAutenticacao = createContext<AuthContextType | undefined>(undefined)

/** Usuário fictício usado apenas no modo demonstração */
const DEMO_SESSION_KEY = 'aurora-demo-session'
const demoUser = { id: 'demo-user', email: 'visitante@aurora.demo' } as User

export function ProvedorDeAutenticacao({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (modoDemonstracao) {
      // Na prévia hospedada o visitante já entra autenticado, a menos que tenha saído
      let loggedOut = false
      try {
        loggedOut = localStorage.getItem(DEMO_SESSION_KEY) === 'out'
      } catch {
        // sem localStorage: mantem a sessao demo
      }
      setUser(loggedOut ? null : demoUser)
      setCarregando(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        setCarregando(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const setDemoSession = (state: 'in' | 'out') => {
    try {
      localStorage.setItem(DEMO_SESSION_KEY, state)
    } catch {
      // ignora
    }
  }

  const signIn = async (email: string, password: string) => {
    if (modoDemonstracao) {
      setDemoSession('in')
      setUser({ ...demoUser, email: email || demoUser.email } as User)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    if (modoDemonstracao) {
      setDemoSession('in')
      setUser({ ...demoUser, email: email || demoUser.email } as User)
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (modoDemonstracao) {
      setDemoSession('out')
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <ContextoDeAutenticacao.Provider value={{ user, carregando, signIn, signUp, signOut, isAuthenticated: !!user }}>
      {children}
    </ContextoDeAutenticacao.Provider>
  )
}

export function useAutenticacao() {
  const context = useContext(ContextoDeAutenticacao)
  if (context === undefined) {
    throw new Error('useAutenticacao precisa estar dentro de um ProvedorDeAutenticacao')
  }
  return context
}
