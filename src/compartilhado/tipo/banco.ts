/**
 * As tabelas do Supabase, escritas em TypeScript.
 *
 * Este arquivo é o espelho de `supabase/schema.sql`: mudou coluna lá, muda tipo
 * aqui. Os nomes de coluna ficam em inglês porque são os nomes que existem no
 * banco — traduzi-los aqui só criaria um dicionário a mais para você decorar.
 *
 * Para cada tabela existem três formas do mesmo dado:
 *
 *   - `X`            o que VEM do banco (linha completa)
 *   - `XParaInserir` o que a tela MANDA para criar
 *   - `XParaAtualizar` o que a tela MANDA para editar (tudo opcional)
 *
 * Elas estão escritas por extenso, uma a uma. Fica mais comprido do que gerar
 * com genéricos, e é de propósito: dá para ler a tabela inteira sem precisar
 * resolver um `Omit<Extract<keyof T, ...>>` de cabeça.
 *
 * Três colunas nunca aparecem nos tipos de inserir, porque o banco as preenche:
 * `id` (default gen_random_uuid), `created_at`/`updated_at` (default now e
 * trigger) e `user_id` (default auth.uid). `user_id` ainda aparece opcional
 * porque o supabase-js aceita recebê-lo, embora o app nunca envie.
 */

// ===================================================================== habits

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
  /** Só existe na memória do app: é calculado a partir das marcações do dia */
  completed_today?: boolean
}

/** Habito como a tabela guarda, sem o campo que só existe na tela */
export type HabitoNoBanco = Omit<Habito, 'completed_today'>

export type HabitoParaInserir = {
  name: string
  description?: string
  icon?: string
  color?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  current_streak: number
  best_streak: number
  user_id?: string
}

export type HabitoParaAtualizar = {
  name?: string
  description?: string
  icon?: string
  color?: string
  frequency?: 'daily' | 'weekly' | 'monthly'
  target_count?: number
  current_streak?: number
  best_streak?: number
  user_id?: string
  created_at?: string
  updated_at?: string
}

// ================================================================= habit_logs

export type MarcacaoDeHabito = {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed: boolean
  notes?: string
  created_at: string
}

export type MarcacaoParaInserir = {
  habit_id: string
  date: string
  completed: boolean
  notes?: string
  user_id?: string
}

export type MarcacaoParaAtualizar = {
  habit_id?: string
  date?: string
  completed?: boolean
  notes?: string
  user_id?: string
  created_at?: string
}

// ====================================================================== books

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

export type LivroParaInserir = {
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
  user_id?: string
}

export type LivroParaAtualizar = {
  title?: string
  author?: string
  cover_url?: string
  status?: 'reading' | 'finished' | 'want_to_read' | 'dropped'
  rating?: number
  notes?: string
  pages_total?: number
  pages_read?: number
  started_date?: string
  finished_date?: string
  google_books_id?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

// =================================================================== finances

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

export type TransacaoParaInserir = {
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  user_id?: string
}

export type TransacaoParaAtualizar = {
  date?: string
  type?: 'income' | 'expense'
  category?: string
  amount?: number
  description?: string
  user_id?: string
  created_at?: string
}

// ====================================================================== goals

/**
 * De onde a meta tira o valor atual. 'manual' mantem o comportamento
 * original: o usuario digita. Rotulos e unidades em modulo/meta/origens.ts.
 */
export type OrigemDaMeta =
  | 'manual'
  | 'books_finished'
  | 'pages_read'
  | 'habit_checkins'
  | 'money_saved'
  | 'money_spent'

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
  /** De onde vem o valor atual. Catalogo em modulo/meta/origens.ts */
  source: OrigemDaMeta
  /** So usado por habit_checkins; nulo se o habito foi apagado */
  source_habit_id?: string | null
  created_at: string
  updated_at: string
}

export type MetaParaInserir = {
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
  source?: OrigemDaMeta
  source_habit_id?: string | null
  user_id?: string
}

export type MetaParaAtualizar = {
  title?: string
  description?: string
  target_value?: number
  current_value?: number
  unit?: string
  start_date?: string
  deadline?: string
  category?: 'reading' | 'habits' | 'finance' | 'health'
  status?: 'active' | 'completed' | 'failed'
  progress_percentage?: number
  source?: OrigemDaMeta
  source_habit_id?: string | null
  user_id?: string
  created_at?: string
  updated_at?: string
}

// ================================================================== mood_logs

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

export type RegistroParaInserir = {
  date: string
  mood: number
  energy: number
  notes?: string
  user_id?: string
}

export type RegistroParaAtualizar = {
  date?: string
  mood?: number
  energy?: number
  notes?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

// =================================================================== insights

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

export type InsightParaInserir = {
  title: string
  description: string
  type: 'correlation' | 'prediction' | 'achievement' | 'daily'
  metadata: any
  user_id?: string
}

export type InsightParaAtualizar = {
  title?: string
  description?: string
  type?: 'correlation' | 'prediction' | 'achievement' | 'daily'
  metadata?: any
  user_id?: string
  generated_at?: string
}

// ==================================================================== o mapa

/**
 * O mapa que o supabase-js usa para tipar as queries.
 *
 * As chaves `Relationships`, `Views`, `Functions`, `Enums` e `CompositeTypes`
 * parecem burocracia — e são —, mas o cliente exige todas. Sem elas, toda
 * query passa a ter tipo `never` e o app inteiro deixa de compilar.
 */
export type Banco = {
  public: {
    Tables: {
      habits: {
        Row: HabitoNoBanco
        Insert: HabitoParaInserir
        Update: HabitoParaAtualizar
        Relationships: []
      }
      habit_logs: {
        Row: MarcacaoDeHabito
        Insert: MarcacaoParaInserir
        Update: MarcacaoParaAtualizar
        Relationships: []
      }
      books: {
        Row: Livro
        Insert: LivroParaInserir
        Update: LivroParaAtualizar
        Relationships: []
      }
      finances: {
        Row: Transacao
        Insert: TransacaoParaInserir
        Update: TransacaoParaAtualizar
        Relationships: []
      }
      goals: {
        Row: Meta
        Insert: MetaParaInserir
        Update: MetaParaAtualizar
        Relationships: []
      }
      mood_logs: {
        Row: RegistroDeHumor
        Insert: RegistroParaInserir
        Update: RegistroParaAtualizar
        Relationships: []
      }
      insights: {
        Row: Insight
        Insert: InsightParaInserir
        Update: InsightParaAtualizar
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
