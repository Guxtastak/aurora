import { HabitService } from '@/modulo/habito/servico'
import { BookService } from '@/modulo/livro/servico'
import { FinanceService } from '@/modulo/financa/servico'
import { MoodService } from '@/modulo/humor/servico'
import { supabase } from '@/compartilhado/fonte/supabase'
import type { Insight } from '@/compartilhado/tipo/banco'
import { toISODate, todayISO } from '@/compartilhado/utilitario/formato'
import { habitMoodCorrelations } from '@/modulo/humor/regraDeComparacao'

export class InsightService {
  /**
   * Gera insights diários
   */
  static async generateDailyInsights() {
    const [habits, books, balance] = await Promise.all([
      HabitService.getHabitsWithTodayStatus(),
      BookService.getBooks(),
      FinanceService.getBalance()
    ])

    const today = todayISO()
    const completedToday = habits.filter(h => h.completed_today).length

    const insights = {
      date: today,
      habits: {
        total: habits.length,
        completedToday,
        completionRate: habits.length > 0 ? (completedToday / habits.length) * 100 : 0,
        bestStreak: habits.length > 0 ? Math.max(...habits.map(h => h.current_streak || 0)) : 0
      },
      books: {
        reading: books.filter(b => b.status === 'reading').length,
        finished: books.filter(b => b.status === 'finished').length,
        total: books.length
      },
      finances: {
        balance: balance.balance,
        income: balance.totalIncome,
        expenses: balance.totalExpenses
      }
    }

    // Salva insights no banco
    const { data, error } = await supabase
      .from('insights')
      .insert({
        title: `Resumo Diário - ${today}`,
        description: 'Análise do dia atual',
        type: 'daily',
        metadata: insights
      })
      .select()
      .single()

    if (error) throw error
    return data as Insight
  }

  /**
   * Busca insights do usuário
   */
  static async getInsights(limit: number = 10) {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Insight[]
  }

  /**
   * Relação entre cumprir cada hábito diário e o humor registrado no dia.
   * A regra do cálculo fica em utils/moodCorrelation, que vale igual aqui e no
   * modo demonstração.
   */
  static async getHabitCorrelations(days: number = 90) {
    const desde = new Date()
    desde.setDate(desde.getDate() - days)

    const [habits, logs, moods] = await Promise.all([
      HabitService.getHabits(),
      HabitService.getLogsSince(toISODate(desde)),
      MoodService.getMoodLogs(days)
    ])

    return habitMoodCorrelations(habits, logs, moods)
  }
}
