import { supabase } from '@/compartilhado/fonte/supabase'
import type { Transacao } from '@/compartilhado/tipo/banco'

export class ServicoDeFinancas {
  /**
   * Busca todas as transações
   */
  static async listarTransacoes() {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data as Transacao[]
  }

  /**
   * Busca transações por período
   */
  static async listarTransacoesPorPeriodo(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Transacao[]
  }

  /**
   * Adiciona uma nova transação
   */
  static async adicionarTransacao(transaction: Omit<Transacao, 'id' | 'created_at' | 'user_id'>) {
    const { data, error } = await supabase
      .from('finances')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    return data as Transacao
  }

  /**
   * Atualiza uma transação
   */
  static async atualizarTransacao(id: string, updates: Partial<Omit<Transacao, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('finances')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Transacao
  }

  /**
   * Remove uma transação
   */
  static async excluirTransacao(id: string) {
    const { error } = await supabase
      .from('finances')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Calcula o saldo atual
   */
  static async obterSaldo() {
    const transacoes = await this.listarTransacoes()

    const totalIncome = transacoes
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = transacoes
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      count: transacoes.length
    }
  }

  /**
   * Busca transações agrupadas por categoria
   */
  static async listarTransacoesPorCategoria() {
    const transacoes = await this.listarTransacoes()
    const categories: { [key: string]: { income: number; expense: number; count: number } } = {}

    transacoes.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = { income: 0, expense: 0, count: 0 }
      }
      categories[t.category].count++
      if (t.type === 'income') {
        categories[t.category].income += Number(t.amount)
      } else {
        categories[t.category].expense += Number(t.amount)
      }
    })

    return categories
  }

  /**
   * Busca resumo mensal
   */
  static async obterResumoDoMes(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    const transacoes = await this.listarTransacoesPorPeriodo(startDate, endDate)

    const income = transacoes
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transacoes
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      income,
      expenses,
      balance: income - expenses,
      count: transacoes.length,
      transacoes
    }
  }

  /**
   * Busca cotação de moeda (Awesome API)
   */
  static async obterCotacaoDoDolar(from: string = 'USD', to: string = 'BRL') {
    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/${from}-${to}`
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar cotação')
    }

    const data = await response.json()
    const key = `${from}${to}`
    return {
      rate: parseFloat(data[key].bid),
      timestamp: data[key].timestamp,
      from,
      to
    }
  }
}
