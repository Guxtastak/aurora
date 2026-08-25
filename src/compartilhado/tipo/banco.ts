export type Habito = {
  id: string
  user_id: string
  name: string
  description?: string
  icon?: string
  color?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  current_streak: number
  best_streak: number
  created_at: string
  updated_at: string
  completed_today?: boolean
}

export type MarcacaoDeHabito = {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed: boolean
  notes?: string
  created_at: string
}

export type Livro = {
  id: string
  user_id: string
  title: string
  author: string
  cover_url?: string
  status: 'reading' | 'finished' | 'want_to_read' | 'dropped'
  rating?: number
  notes?: string
  pages_total?: number
  pages_read?: number
  started_date?: string
  finished_date?: string
  google_books_id?: string
  created_at: string
  updated_at: string
}

export type Transacao = {
  id: string
  user_id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  created_at: string
}

export type Meta = {
  id: string
  user_id: string
  title: string
  description?: string
  target_value?: number
  current_value?: number
  unit?: string
  start_date?: string
  deadline?: string
  category: 'reading' | 'habits' | 'finance' | 'health'
  status: 'active' | 'completed' | 'failed'
  progress_percentage: number
  created_at: string
  updated_at: string
}

export type RegistroDeHumor = {
  id: string
  user_id: string
  date: string
  /** Escala de 1 a 5 */
  mood: number
  /** Escala de 1 a 5 */
  energy: number
  notes?: string
  created_at: string
  updated_at: string
}

export type Insight = {
  id: string
  user_id: string
  title: string
  description: string
  // 'daily' incluído porque ServicoDeInsights.gerarInsightDoDia grava esse tipo
  type: 'correlation' | 'prediction' | 'achievement' | 'daily'
  metadata: any
  generated_at: string
}

/**
 * Colunas preenchidas pelo banco (defaults/triggers) e que o front nunca envia.
 * user_id entra aqui porque as tabelas usam DEFAULT auth.uid() — veja supabase/schema.sql.
 */
type Generated = 'id' | 'user_id' | 'created_at' | 'updated_at'

/** Campo que existe somente em memória (calculado no client) */
type ClientOnly = 'completed_today'

/** Habito como existe no banco (sem o campo calculado no client) */
export type HabitoNoBanco = Omit<Habito, ClientOnly>

type InsertOf<T> = Omit<T, Extract<keyof T, Generated | ClientOnly>> & { user_id?: string }
type UpdateOf<T> = Partial<Omit<T, 'id' | Extract<keyof T, ClientOnly>>>

/**
 * O supabase-js v2 exige, além de Row/Insert/Update, a chave `Relationships`
 * em cada tabela e as seções `Views`/`Functions` no schema. Sem isso o cliente
 * tipado resolve todas as queries como `never`.
 */
export type Banco = {
  public: {
    Tables: {
      habits: {
        Row: HabitoNoBanco
        Insert: InsertOf<HabitoNoBanco>
        Update: UpdateOf<HabitoNoBanco>
        Relationships: []
      }
      habit_logs: {
        Row: MarcacaoDeHabito
        Insert: InsertOf<MarcacaoDeHabito>
        Update: UpdateOf<MarcacaoDeHabito>
        Relationships: []
      }
      books: {
        Row: Livro
        Insert: InsertOf<Livro>
        Update: UpdateOf<Livro>
        Relationships: []
      }
      finances: {
        Row: Transacao
        Insert: InsertOf<Transacao>
        Update: UpdateOf<Transacao>
        Relationships: []
      }
      goals: {
        Row: Meta
        Insert: InsertOf<Meta>
        Update: UpdateOf<Meta>
        Relationships: []
      }
      mood_logs: {
        Row: RegistroDeHumor
        Insert: InsertOf<RegistroDeHumor>
        Update: UpdateOf<RegistroDeHumor>
        Relationships: []
      }
      insights: {
        Row: Insight
        Insert: Omit<Insight, 'id' | 'user_id' | 'generated_at'> & { user_id?: string }
        Update: Partial<Omit<Insight, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
