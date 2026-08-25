/**
 * Tudo que o app faz com hábitos no Supabase.
 *
 * As telas não chamam este arquivo direto: elas importam de
 * compartilhado/fonte/fonteDeDados, que escolhe entre este e demonstracao.ts.
 */
import { supabase } from '@/compartilhado/fonte/supabase'
import type { Habito, HabitoNoBanco, MarcacaoDeHabito } from '@/compartilhado/tipo/banco'

/** Retorna a data (YYYY-MM-DD) local, sem deslocamento de timezone */
function paraDataISO(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

export class ServicoDeHabitos {
  /**
   * Busca todos os habitos do usuario logado
   */
  static async listarHabitos() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Habito[]
  }

  /**
   * Busca todos os habitos ja marcando quais foram concluidos hoje
   */
  static async listarHabitosComStatusDeHoje() {
    const today = paraDataISO(new Date())
    const habits = await this.listarHabitos()

    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('habit_id, completed')
      .eq('date', today)

    if (error) throw error

    const doneToday = new Set(
      (logs || []).filter(l => l.completed).map(l => l.habit_id)
    )

    return habits.map(h => ({ ...h, completed_today: doneToday.has(h.id) }))
  }

  /**
   * Busca habito por ID
   */
  static async buscarHabitoPorId(id: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Habito
  }

  /**
   * Cria um novo habito
   */
  static async criarHabito(
    habit: Omit<HabitoNoBanco, 'id' | 'created_at' | 'updated_at' | 'current_streak' | 'best_streak' | 'user_id'>
  ) {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habit,
        current_streak: 0,
        best_streak: 0
      })
      .select()
      .single()

    if (error) throw error
    return data as Habito
  }

  /**
   * Atualiza um habito existente
   */
  static async atualizarHabito(id: string, updates: Partial<Omit<Habito, 'id' | 'created_at' | 'updated_at' | 'completed_today'>>) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Habito
  }

  /**
   * Remove um habito
   */
  static async excluirHabito(id: string) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Marca ou desmarca um habito para hoje
   */
  static async alternarHabitoDeHoje(habitId: string) {
    const today = paraDataISO(new Date())
    return this.alternarHabitoNaData(habitId, today)
  }

  /**
   * Marca ou desmarca um habito em uma data especifica
   */
  static async alternarHabitoNaData(habitId: string, date: string) {
    // Verifica se ja existe log
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      // Alterna o status
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ completed: !existing.completed })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      // Atualiza streak
      await this.recalcularSequencia(habitId)
      return data as MarcacaoDeHabito
    } else {
      // Cria novo log
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          date: date,
          completed: true
        })
        .select()
        .single()

      if (error) throw error

      // Atualiza streak
      await this.recalcularSequencia(habitId)
      return data as MarcacaoDeHabito
    }
  }

  /**
   * Busca logs de um habito
   */
  static async listarMarcacoesDoHabito(habitId: string, limit?: number) {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as MarcacaoDeHabito[]
  }

  /**
   * Busca todos os logs concluidos a partir de uma data (para heatmap/graficos)
   */
  static async listarMarcacoesDesde(startDate: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', startDate)
      .eq('completed', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data as MarcacaoDeHabito[]
  }

  /**
   * Calcula e atualiza a streak de um habito
   */
  static async recalcularSequencia(habitId: string) {
    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('date, completed')
      .eq('habit_id', habitId)
      .eq('completed', true)
      .order('date', { ascending: false })

    if (error) throw error

    const dates = [...new Set((logs || []).map(l => l.date))].sort().reverse()

    // Streak atual: conta dias consecutivos terminando em hoje (ou ontem, se hoje
    // ainda nao foi marcado, para nao "zerar" o habito durante o dia)
    let currentStreak = 0
    const cursor = new Date()
    if (dates.length > 0 && dates[0] !== paraDataISO(cursor)) {
      cursor.setDate(cursor.getDate() - 1)
    }
    for (const date of dates) {
      if (date === paraDataISO(cursor)) {
        currentStreak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    // Melhor streak: maior sequencia consecutiva em todo o historico
    let bestStreak = 0
    let run = 0
    let previous: Date | null = null
    for (const date of [...dates].reverse()) {
      const current = new Date(`${date}T00:00:00`)
      if (previous) {
        const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000)
        run = diffDays === 1 ? run + 1 : 1
      } else {
        run = 1
      }
      if (run > bestStreak) bestStreak = run
      previous = current
    }

    // Atualiza no banco
    const { data, error: updateError } = await supabase
      .from('habits')
      .update({
        current_streak: currentStreak,
        best_streak: Math.max(currentStreak, bestStreak)
      })
      .eq('id', habitId)
      .select()
      .single()

    if (updateError) throw updateError
    return data as Habito
  }
}
