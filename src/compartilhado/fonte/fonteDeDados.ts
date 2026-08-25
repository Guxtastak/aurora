import { modoDemonstracao } from '@/compartilhado/fonte/supabase'
import { ServicoDeHabitos as SupabaseHabitService } from '@/modulo/habito/servico'
import { ServicoDeLivros as SupabaseBookService } from '@/modulo/livro/servico'
import { ServicoDeFinancas as SupabaseFinanceService } from '@/modulo/financa/servico'
import { ServicoDeMetas as SupabaseGoalService } from '@/modulo/meta/servico'
import { ServicoDeHumor as SupabaseMoodService } from '@/modulo/humor/servico'
import { ServicoDeInsights as SupabaseInsightService } from '@/modulo/painel/servico'
import {
  HabitosDaDemonstracao,
  LivrosDaDemonstracao,
  FinancasDaDemonstracao,
  MetasDaDemonstracao,
  HumorDaDemonstracao,
  InsightsDaDemonstracao
} from '@/compartilhado/fonte/servicosDeDemonstracao'

/**
 * Ponto único de acesso aos dados: com Supabase configurado usa os serviços
 * reais; sem credenciais, cai no modo demonstração (localStorage). As telas
 * importam sempre daqui e não precisam saber qual dos dois está ativo.
 */

export const ServicoDeHabitos: typeof SupabaseHabitService = modoDemonstracao
  ? (HabitosDaDemonstracao as unknown as typeof SupabaseHabitService)
  : SupabaseHabitService

export const ServicoDeLivros: typeof SupabaseBookService = modoDemonstracao
  ? (LivrosDaDemonstracao as unknown as typeof SupabaseBookService)
  : SupabaseBookService

export const ServicoDeFinancas: typeof SupabaseFinanceService = modoDemonstracao
  ? (FinancasDaDemonstracao as unknown as typeof SupabaseFinanceService)
  : SupabaseFinanceService

export const ServicoDeMetas: typeof SupabaseGoalService = modoDemonstracao
  ? (MetasDaDemonstracao as unknown as typeof SupabaseGoalService)
  : SupabaseGoalService

export const ServicoDeHumor: typeof SupabaseMoodService = modoDemonstracao
  ? (HumorDaDemonstracao as unknown as typeof SupabaseMoodService)
  : SupabaseMoodService

export const ServicoDeInsights: typeof SupabaseInsightService = modoDemonstracao
  ? (InsightsDaDemonstracao as unknown as typeof SupabaseInsightService)
  : SupabaseInsightService

export { modoDemonstracao }
