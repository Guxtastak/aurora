import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, isDemo } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Usuário fictício usado apenas no modo demonstração */
const DEMO_SESSION_KEY = 'aurora-demo-session'
const demoUser = { id: 'demo-user', email: 'visitante@aurora.demo' } as User

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      // Na prévia hospedada o visitante já entra autenticado, a menos que tenha saído
      let loggedOut = false
      try {
        loggedOut = localStorage.getItem(DEMO_SESSION_KEY) === 'out'
      } catch {
        // sem localStorage: mantem a sessao demo
      }
      setUser(loggedOut ? null : demoUser)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        setLoading(false)
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
    if (isDemo) {
      setDemoSession('in')
      setUser({ ...demoUser, email: email || demoUser.email } as User)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    if (isDemo) {
      setDemoSession('in')
      setUser({ ...demoUser, email: email || demoUser.email } as User)
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (isDemo) {
      setDemoSession('out')
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
