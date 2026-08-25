import { supabase } from './supabase'
import type { Goal } from '../types/database.types'
import { goalProgress, resolveGoalStatus } from '../utils/goalProgress'

/** Campos que a tela envia; progresso e status derivados são calculados aqui */
export type GoalInput = Omit<
  Goal,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress_percentage'
>

/** Reduz uma meta do banco aos campos editaveis, sem id nem colunas geradas */
function toInput(goal: Goal): GoalInput {
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
function derive<T extends Partial<GoalInput> & { status: Goal['status'] }>(goal: T) {
  return {
    ...goal,
    status: resolveGoalStatus(goal),
    progress_percentage: goalProgress(goal.current_value, goal.target_value)
  }
}

export class GoalService {
  /**
   * Busca todas as metas do usuario logado
   */
  static async getGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Goal[]
  }

  /**
   * Busca meta por ID
   */
  static async getGoalById(id: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Goal
  }

  /**
   * Cria uma nova meta
   */
  static async createGoal(goal: GoalInput) {
    const { data, error } = await supabase
      .from('goals')
      .insert(derive(goal))
      .select()
      .single()

    if (error) throw error
    return data as Goal
  }

  /**
   * Atualiza uma meta. Le a meta atual antes para que uma alteracao parcial
   * (so o valor atual, por exemplo) recalcule progresso e status sobre os
   * valores completos, e nao sobre os campos que vieram no update.
   */
  static async updateGoal(id: string, updates: Partial<GoalInput>) {
    const current = await this.getGoalById(id)
    const merged = { ...toInput(current), ...updates }

    const { data, error } = await supabase
      .from('goals')
      .update(derive(merged))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  }

  /**
   * Remove uma meta
   */
  static async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
