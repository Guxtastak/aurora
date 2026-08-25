import { supabase } from '@/compartilhado/fonte/supabase'
import type { Meta } from '@/compartilhado/tipo/banco'
import { progressoDaMeta, resolverStatusDaMeta } from '@/modulo/meta/regraDeProgresso'

/** Campos que a tela envia; progresso e status derivados são calculados aqui */
export type DadosDaMeta = Omit<
  Meta,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress_percentage'
>

/** Reduz uma meta do banco aos campos editaveis, sem id nem colunas geradas */
function toInput(goal: Meta): DadosDaMeta {
  return {
    title: goal.title,
    description: goal.description,
    target_value: goal.target_value,
    current_value: goal.current_value,
    unit: goal.unit,
    start_date: goal.start_date,
    deadline: goal.deadline,
    category: goal.category,
    status: goal.status
  }
}

/** Aplica as regras de progresso/status sobre os campos informados */
function derive<T extends Partial<DadosDaMeta> & { status: Meta['status'] }>(goal: T) {
  return {
    ...goal,
    status: resolverStatusDaMeta(goal),
    progress_percentage: progressoDaMeta(goal.current_value, goal.target_value)
  }
}

export class ServicoDeMetas {
  /**
   * Busca todas as metas do usuario logado
   */
  static async listarMetas() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Meta[]
  }

  /**
   * Busca meta por ID
   */
  static async buscarMetaPorId(id: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Meta
  }

  /**
   * Cria uma nova meta
   */
  static async criarMeta(goal: DadosDaMeta) {
    const { data, error } = await supabase
      .from('goals')
      .insert(derive(goal))
      .select()
      .single()

    if (error) throw error
    return data as Meta
  }

  /**
   * Atualiza uma meta. Le a meta atual antes para que uma alteracao parcial
   * (so o valor atual, por exemplo) recalcule progresso e status sobre os
   * valores completos, e nao sobre os campos que vieram no update.
   */
  static async atualizarMeta(id: string, updates: Partial<DadosDaMeta>) {
    const current = await this.buscarMetaPorId(id)
    const merged = { ...toInput(current), ...updates }

    const { data, error } = await supabase
      .from('goals')
      .update(derive(merged))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Meta
  }

  /**
   * Remove uma meta
   */
  static async excluirMeta(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
