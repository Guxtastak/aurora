import type { Habito, HabitoNoBanco, MarcacaoDeHabito } from '@/compartilhado/tipo/banco'
import { agoraISO, gravarDemonstracao, hojeNaDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'

/**
 * Hábitos no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
function recalcularSequenciasNaDemonstracao(habitId: string) {
  const data = lerDemonstracao()
  const dates = [
    ...new Set(data.habit_logs.filter(l => l.habit_id === habitId && l.completed).map(l => l.date))
  ]
    .sort()
    .reverse()

  let currentStreak = 0
  const cursor = new Date()
  const toISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().split('T')[0]
  }
  if (dates.length > 0 && dates[0] !== toISO(cursor)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (const date of dates) {
    if (date === toISO(cursor)) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

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

  data.habits = data.habits.map(h =>
    h.id === habitId
      ? { ...h, current_streak: currentStreak, best_streak: Math.max(currentStreak, bestStreak) }
      : h
  )
  gravarDemonstracao(data)
  return data.habits.find(h => h.id === habitId) as Habito
}

export class HabitosDaDemonstracao {
  static async listarHabitos() {
    return [...lerDemonstracao().habits].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async listarHabitosComStatusDeHoje() {
    const data = lerDemonstracao()
    const today = hojeNaDemonstracao()
    const done = new Set(
      data.habit_logs.filter(l => l.date === today && l.completed).map(l => l.habit_id)
    )
    return (await this.listarHabitos()).map(h => ({ ...h, completed_today: done.has(h.id) }))
  }

  static async buscarHabitoPorId(id: string) {
    return lerDemonstracao().habits.find(h => h.id === id) as Habito
  }

  static async criarHabito(
    habit: Omit<HabitoNoBanco, 'id' | 'created_at' | 'updated_at' | 'current_streak' | 'best_streak' | 'user_id'>
  ) {
    const data = lerDemonstracao()
    const created: Habito = {
      ...habit,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      current_streak: 0,
      best_streak: 0,
      created_at: agoraISO(),
      updated_at: agoraISO()
    }
    data.habits = [created, ...data.habits]
    gravarDemonstracao(data)
    return created
  }

  static async atualizarHabito(
    id: string,
    updates: Partial<Omit<Habito, 'id' | 'created_at' | 'updated_at' | 'completed_today'>>
  ) {
    const data = lerDemonstracao()
    data.habits = data.habits.map(h =>
      h.id === id ? { ...h, ...updates, updated_at: agoraISO() } : h
    )
    gravarDemonstracao(data)
    return data.habits.find(h => h.id === id) as Habito
  }

  static async excluirHabito(id: string) {
    const data = lerDemonstracao()
    data.habits = data.habits.filter(h => h.id !== id)
    data.habit_logs = data.habit_logs.filter(l => l.habit_id !== id)
    gravarDemonstracao(data)
  }

  static async alternarHabitoDeHoje(habitId: string) {
    return this.alternarHabitoNaData(habitId, hojeNaDemonstracao())
  }

  static async alternarHabitoNaData(habitId: string, date: string) {
    const data = lerDemonstracao()
    const existing = data.habit_logs.find(l => l.habit_id === habitId && l.date === date)

    let log: MarcacaoDeHabito
    if (existing) {
      log = { ...existing, completed: !existing.completed }
      data.habit_logs = data.habit_logs.map(l => (l.id === existing.id ? log : l))
    } else {
      log = {
        id: novoId(),
        habit_id: habitId,
        user_id: usuarioDaDemonstracao,
        date,
        completed: true,
        created_at: agoraISO()
      }
      data.habit_logs = [...data.habit_logs, log]
    }

    gravarDemonstracao(data)
    recalcularSequenciasNaDemonstracao(habitId)
    return log
  }

  static async listarMarcacoesDoHabito(habitId: string, limit?: number) {
    const logs = lerDemonstracao()
      .habit_logs.filter(l => l.habit_id === habitId)
      .sort((a, b) => b.date.localeCompare(a.date))
    return limit ? logs.slice(0, limit) : logs
  }

  static async listarMarcacoesDesde(startDate: string) {
    return lerDemonstracao()
      .habit_logs.filter(l => l.completed && l.date >= startDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  static async recalcularSequencia(habitId: string) {
    return recalcularSequenciasNaDemonstracao(habitId)
  }
}
