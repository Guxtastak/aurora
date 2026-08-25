import { supabase } from '@/compartilhado/fonte/supabase'
import type { RegistroDeHumor } from '@/compartilhado/tipo/banco'
import { paraDataISO, dataDeHoje } from '@/compartilhado/utilitario/formato'

/** Campos que a tela envia; o resto vem do banco (id, user_id, timestamps) */
export type DadosDoRegistro = {
  date: string
  mood: number
  energy: number
  notes?: string
}

function daysAgoISO(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return paraDataISO(date)
}

export class ServicoDeHumor {
  /**
   * Registros dos ultimos N dias, do mais recente para o mais antigo
   */
  static async listarRegistrosDeHumor(days: number = 30) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .gte('date', daysAgoISO(days))
      .order('date', { ascending: false })

    if (error) throw error
    return data as RegistroDeHumor[]
  }

  /**
   * Registro de um dia, ou null se aquele dia ainda nao foi preenchido
   */
  static async buscarRegistroPorData(date: string = dataDeHoje()) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (error) throw error
    return (data as RegistroDeHumor) || null
  }

  /**
   * Grava o humor do dia. Le antes para decidir entre insert e update em vez de
   * usar upsert: o onConflict precisaria citar (user_id, date), e user_id nao
   * vai no payload — vem do DEFAULT auth.uid(). E o mesmo caminho que o
   * ServicoDeHabitos.alternarHabitoNaData faz sobre unique (habit_id, date).
   */
  static async gravarRegistroDoDia(input: DadosDoRegistro) {
    const existing = await this.buscarRegistroPorData(input.date)

    if (existing) {
      const { data, error } = await supabase
        .from('mood_logs')
        .update({ mood: input.mood, energy: input.energy, notes: input.notes })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as RegistroDeHumor
    }

    const { data, error } = await supabase
      .from('mood_logs')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as RegistroDeHumor
  }

  /**
   * Remove o registro de um dia
   */
  static async excluirRegistro(id: string) {
    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
