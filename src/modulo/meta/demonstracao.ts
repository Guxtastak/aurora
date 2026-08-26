import type { DadosDaMeta } from '@/modulo/meta/servico'
import type { Meta } from '@/compartilhado/tipo/banco'
import { agoraISO, gravarDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { progressoDaMeta, resolverStatusDaMeta } from '@/modulo/meta/regraDeProgresso'

/**
 * Metas no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
export class MetasDaDemonstracao {
  static async listarMetas() {
    return [...lerDemonstracao().goals].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async buscarMetaPorId(id: string) {
    return lerDemonstracao().goals.find(g => g.id === id) as Meta
  }

  static async criarMeta(goal: DadosDaMeta) {
    const data = lerDemonstracao()
    const created: Meta = {
      ...goal,
      source: goal.source || 'manual',
      source_habit_id: goal.source_habit_id ?? null,
      status: resolverStatusDaMeta(goal),
      progress_percentage: progressoDaMeta(goal.current_value, goal.target_value),
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: agoraISO(),
      updated_at: agoraISO()
    }
    data.goals = [created, ...data.goals]
    gravarDemonstracao(data)
    return created
  }

  static async atualizarMeta(id: string, updates: Partial<DadosDaMeta>) {
    const data = lerDemonstracao()
    let updated: Meta | undefined

    data.goals = data.goals.map(g => {
      if (g.id !== id) return g
      const merged = { ...g, ...updates }
      updated = {
        ...merged,
        status: resolverStatusDaMeta(merged),
        progress_percentage: progressoDaMeta(merged.current_value, merged.target_value),
        updated_at: agoraISO()
      }
      return updated
    })

    gravarDemonstracao(data)
    return updated as Meta
  }

  static async excluirMeta(id: string) {
    const data = lerDemonstracao()
    data.goals = data.goals.filter(g => g.id !== id)
    gravarDemonstracao(data)
  }
}
