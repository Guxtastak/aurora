import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/compartilhado/tipo/banco'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Modo demonstração: sem credenciais válidas do Supabase o app roda com dados
 * de exemplo no localStorage (é assim que a prévia do GitHub Pages funciona).
 * Preencha o .env com a URL e a anon key do seu projeto para usar o banco real.
 */
export const isDemo = !supabaseUrl || !supabaseAnonKey || !/^https?:\/\//.test(supabaseUrl)

// Em modo demo o cliente nunca é usado, mas precisa de uma URL sintaticamente
// válida para o createClient não lançar durante o import.
export const supabase = createClient<Database>(
  isDemo ? 'https://demo.invalid' : supabaseUrl,
  isDemo ? 'demo-anon-key' : supabaseAnonKey
)
