import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Mensagem clara no primeiro boot, antes do erro genérico de URL inválida do SDK
if (!/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(
    'VITE_SUPABASE_URL inválida. Preencha o arquivo .env com a URL e a anon key do seu projeto Supabase ' +
      '(Project Settings > API) e reinicie o servidor de desenvolvimento.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
