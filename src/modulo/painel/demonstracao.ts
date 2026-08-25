import type { Insight } from '@/compartilhado/tipo/banco'
import { FinancasDaDemonstracao } from '@/modulo/financa/demonstracao'
import { HabitosDaDemonstracao } from '@/modulo/habito/demonstracao'
import { LivrosDaDemonstracao } from '@/modulo/livro/demonstracao'
import { agoraISO, gravarDemonstracao, hojeNaDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { compararHabitosComHumor } from '@/modulo/humor/regraDeComparacao'
import { paraDataISO } from '@/compartilhado/utilitario/formato'

/**
 * Insights no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
export class InsightsDaDemonstracao {
  static async gerarInsightDoDia() {
    const [habits, books, balance] = await Promise.all([
      HabitosDaDemonstracao.listarHabitosComStatusDeHoje(),
      LivrosDaDemonstracao.listarLivros(),
      FinancasDaDemonstracao.obterSaldo()
    ])

    const today = hojeNaDemonstracao()
    const completedToday = habits.filter(h => h.completed_today).length

    const metadata = {
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

    const data = lerDemonstracao()
    const created: Insight = {
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      title: `Resumo Diário - ${today}`,
      description: 'Análise do dia atual',
      type: 'daily',
      metadata,
      generated_at: agoraISO()
    }
    data.insights = [created, ...data.insights]
    gravarDemonstracao(data)
    return created
  }

  static async listarInsights(limit: number = 10) {
    return lerDemonstracao()
      .insights.slice()
      .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
      .slice(0, limit)
  }

  static async obterComparacaoDosHabitos(days: number = 90) {
    const desde = new Date()
    desde.setDate(desde.getDate() - days)
    const inicio = paraDataISO(desde)
    const data = lerDemonstracao()

    return compararHabitosComHumor(
      data.habits,
      data.habit_logs,
      data.mood_logs.filter(log => log.date >= inicio)
    )
  }
}
