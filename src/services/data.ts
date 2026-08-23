import { isDemo } from './supabase'
import { HabitService as SupabaseHabitService } from './habitService'
import { BookService as SupabaseBookService } from './bookService'
import { FinanceService as SupabaseFinanceService } from './financeService'
import { InsightService as SupabaseInsightService } from './insightService'
import {
  DemoHabitService,
  DemoBookService,
  DemoFinanceService,
  DemoInsightService
} from './demo/demoServices'

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

export const InsightService: typeof SupabaseInsightService = isDemo
  ? (DemoInsightService as unknown as typeof SupabaseInsightService)
  : SupabaseInsightService

export { isDemo }
