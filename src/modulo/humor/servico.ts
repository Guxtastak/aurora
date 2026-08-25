import { supabase } from '@/compartilhado/fonte/supabase'
import type { MoodLog } from '@/compartilhado/tipo/banco'
import { toISODate, todayISO } from '@/compartilhado/utilitario/formato'

/** Campos que a tela envia; o resto vem do banco (id, user_id, timestamps) */
export type MoodInput = {
  date: string
  mood: number
  energy: number
  notes?: string
}

function daysAgoISO(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

export class MoodService {
  /**
   * Registros dos ultimos N dias, do mais recente para o mais antigo
   */
  static async getMoodLogs(days: number = 30) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .gte('date', daysAgoISO(days))
      .order('date', { ascending: false })

    if (error) throw error
    return data as MoodLog[]
  }

  /**
   * Registro de um dia, ou null se aquele dia ainda nao foi preenchido
   */
  static async getMoodByDate(date: string = todayISO()) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (error) throw error
    return (data as MoodLog) || null
  }

  /**
   * Grava o humor do dia. Le antes para decidir entre insert e update em vez de
   * usar upsert: o onConflict precisaria citar (user_id, date), e user_id nao
   * vai no payload — vem do DEFAULT auth.uid(). E o mesmo caminho que o
   * HabitService.toggleHabitOnDate faz sobre unique (habit_id, date).
   */
  static async saveMood(input: MoodInput) {
    const existing = await this.getMoodByDate(input.date)

    if (existing) {
      const { data, error } = await supabase
        .from('mood_logs')
        .update({ mood: input.mood, energy: input.energy, notes: input.notes })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as MoodLog
    }

    const { data, error } = await supabase
      .from('mood_logs')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as MoodLog
  }

  /**
   * Remove o registro de um dia
   */
  static async deleteMood(id: string) {
    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
