import type { Goal } from '../types/database.types'
import { percent, todayISO } from './format'

/**
 * Regras de progresso e status das metas. Ficam aqui, fora do serviço, porque
 * valem igual para o Supabase e para o modo demonstração — e porque assim dá
 * para testá-las sem banco.
 */

type Measurable = {
  current_value?: number | null
  target_value?: number | null
  status: Goal['status']
}

/** Meta é mensurável quando tem um alvo numérico maior que zero */
function isMeasurable(goal: Measurable) {
  return typeof goal.target_value === 'number' && goal.target_value > 0
}

/** Progresso da meta em 0-100. Meta sem alvo (qualitativa) não tem progresso. */
export function goalProgress(currentValue?: number | null, targetValue?: number | null) {
  if (!targetValue || targetValue <= 0) return 0
  return percent(currentValue || 0, targetValue)
}

/**
 * Status resultante depois de mexer nos valores. Bater o alvo conclui a meta e
 * cair abaixo dele reabre a que estava concluída; fora disso a escolha do
 * usuário é respeitada — em especial `failed`, que o app nunca declara sozinho.
 * Meta sem alvo não sofre automação nenhuma.
 */
export function resolveGoalStatus(goal: Measurable): Goal['status'] {
  if (!isMeasurable(goal)) return goal.status

  if (goalProgress(goal.current_value, goal.target_value) >= 100) return 'completed'

  return goal.status === 'completed' ? 'active' : goal.status
}

/** Meta ainda ativa cujo prazo já passou. O dia do prazo não conta como atraso. */
export function isGoalOverdue(goal: { deadline?: string | null; status: Goal['status'] }) {
  if (!goal.deadline || goal.status !== 'active') return false
  return goal.deadline.slice(0, 10) < todayISO()
}
