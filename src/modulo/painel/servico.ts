/**
 * O que o painel calcula cruzando os módulos: o insight do dia (que é
 * gravado na tabela insights) e a comparação entre hábitos e humor.
 */
import { ServicoDeHabitos } from '@/modulo/habito/servico'
import { ServicoDeLivros } from '@/modulo/livro/servico'
import { ServicoDeFinancas } from '@/modulo/financa/servico'
import { ServicoDeHumor } from '@/modulo/humor/servico'
import { supabase } from '@/compartilhado/fonte/supabase'
import type { Insight } from '@/compartilhado/tipo/banco'
import { paraDataISO, dataDeHoje } from '@/compartilhado/utilitario/formato'
import { compararHabitosComHumor } from '@/modulo/humor/regraDeComparacao'

export class ServicoDeInsights {
  /**
   * Gera insights diários
   */
  static async gerarInsightDoDia() {
    const [habits, books, balance] = await Promise.all([
      ServicoDeHabitos.listarHabitosComStatusDeHoje(),
      ServicoDeLivros.listarLivros(),
      ServicoDeFinancas.obterSaldo()
    ])

    const today = dataDeHoje()
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
  static async listarInsights(limit: number = 10) {
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
  static async obterComparacaoDosHabitos(days: number = 90) {
    const desde = new Date()
    desde.setDate(desde.getDate() - days)

    const [habits, logs, moods] = await Promise.all([
      ServicoDeHabitos.listarHabitos(),
      ServicoDeHabitos.listarMarcacoesDesde(paraDataISO(desde)),
      ServicoDeHumor.listarRegistrosDeHumor(days)
    ])

    return compararHabitosComHumor(habits, logs, moods)
  }
}
