export type Habit = {
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

export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed: boolean
  notes?: string
  created_at: string
}

export type Book = {
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

export type Finance = {
  id: string
  user_id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  created_at: string
}

export type Goal = {
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

export type MoodLog = {
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
  // 'daily' incluído porque InsightService.generateDailyInsights grava esse tipo
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

/** Habit como existe no banco (sem o campo calculado no client) */
export type HabitRow = Omit<Habit, ClientOnly>

type InsertOf<T> = Omit<T, Extract<keyof T, Generated | ClientOnly>> & { user_id?: string }
type UpdateOf<T> = Partial<Omit<T, 'id' | Extract<keyof T, ClientOnly>>>

/**
 * O supabase-js v2 exige, além de Row/Insert/Update, a chave `Relationships`
 * em cada tabela e as seções `Views`/`Functions` no schema. Sem isso o cliente
 * tipado resolve todas as queries como `never`.
 */
export type Database = {
  public: {
    Tables: {
      habits: {
        Row: HabitRow
        Insert: InsertOf<HabitRow>
        Update: UpdateOf<HabitRow>
        Relationships: []
      }
      habit_logs: {
        Row: HabitLog
        Insert: InsertOf<HabitLog>
        Update: UpdateOf<HabitLog>
        Relationships: []
      }
      books: {
        Row: Book
        Insert: InsertOf<Book>
        Update: UpdateOf<Book>
        Relationships: []
      }
      finances: {
        Row: Finance
        Insert: InsertOf<Finance>
        Update: UpdateOf<Finance>
        Relationships: []
      }
      goals: {
        Row: Goal
        Insert: InsertOf<Goal>
        Update: UpdateOf<Goal>
        Relationships: []
      }
      mood_logs: {
        Row: MoodLog
        Insert: InsertOf<MoodLog>
        Update: UpdateOf<MoodLog>
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
