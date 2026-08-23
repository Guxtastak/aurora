import { HabitService } from './habitService'
import { BookService } from './bookService'
import { FinanceService } from './financeService'
import { supabase } from './supabase'
import type { Insight } from '../types/database.types'
import { todayISO } from '../utils/format'

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
   * Analisa correlações entre hábitos e humor (simulado)
   */
  static async getHabitCorrelations() {
    // Esta é uma simulação - em produção, usaria dados reais
    return {
      reading: { productivity: 0.75, mood: 0.60 },
      exercise: { productivity: 0.85, mood: 0.80 },
      meditation: { productivity: 0.70, mood: 0.90 }
    }
  }
}
