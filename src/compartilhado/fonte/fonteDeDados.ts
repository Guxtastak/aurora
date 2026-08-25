import { isDemo } from '@/compartilhado/fonte/supabase'
import { HabitService as SupabaseHabitService } from '@/modulo/habito/servico'
import { BookService as SupabaseBookService } from '@/modulo/livro/servico'
import { FinanceService as SupabaseFinanceService } from '@/modulo/financa/servico'
import { GoalService as SupabaseGoalService } from '@/modulo/meta/servico'
import { MoodService as SupabaseMoodService } from '@/modulo/humor/servico'
import { InsightService as SupabaseInsightService } from '@/modulo/painel/servico'
import {
  DemoHabitService,
  DemoBookService,
  DemoFinanceService,
  DemoGoalService,
  DemoMoodService,
  DemoInsightService
} from '@/compartilhado/fonte/servicosDeDemonstracao'

/**
 * Ponto único de acesso aos dados: com Supabase configurado usa os serviços
 * reais; sem credenciais, cai no modo demonstração (localStorage). As telas
 * importam sempre daqui e não precisam saber qual dos dois está ativo.
 */

export const HabitService: typeof SupabaseHabitService = isDemo
  ? (DemoHabitService as unknown as typeof SupabaseHabitService)
  : SupabaseHabitService

export const BookService: typeof SupabaseBookService = isDemo
  ? (DemoBookService as unknown as typeof SupabaseBookService)
  : SupabaseBookService

export const FinanceService: typeof SupabaseFinanceService = isDemo
  ? (DemoFinanceService as unknown as typeof SupabaseFinanceService)
  : SupabaseFinanceService

export const GoalService: typeof SupabaseGoalService = isDemo
  ? (DemoGoalService as unknown as typeof SupabaseGoalService)
  : SupabaseGoalService

export const MoodService: typeof SupabaseMoodService = isDemo
  ? (DemoMoodService as unknown as typeof SupabaseMoodService)
  : SupabaseMoodService

export const InsightService: typeof SupabaseInsightService = isDemo
  ? (DemoInsightService as unknown as typeof SupabaseInsightService)
  : SupabaseInsightService

export { isDemo }
