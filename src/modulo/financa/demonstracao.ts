import type { Transacao } from '@/compartilhado/tipo/banco'
import { ServicoDeFinancas } from '@/modulo/financa/servico'
import { agoraISO, gravarDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'

/**
 * Finanças no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
export class FinancasDaDemonstracao {
  // Cotação vem de uma API pública, sem relação com o Supabase
  static obterCotacaoDoDolar = ServicoDeFinancas.obterCotacaoDoDolar.bind(ServicoDeFinancas)

  static async listarTransacoes() {
    return [...lerDemonstracao().finances].sort((a, b) => b.date.localeCompare(a.date))
  }

  static async listarTransacoesPorPeriodo(startDate: string, endDate: string) {
    return (await this.listarTransacoes()).filter(t => t.date >= startDate && t.date <= endDate)
  }

  static async adicionarTransacao(transaction: Omit<Transacao, 'id' | 'created_at' | 'user_id'>) {
    const data = lerDemonstracao()
    const created: Transacao = {
      ...transaction,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: agoraISO()
    }
    data.finances = [created, ...data.finances]
    gravarDemonstracao(data)
    return created
  }

  static async atualizarTransacao(id: string, updates: Partial<Omit<Transacao, 'id' | 'created_at'>>) {
    const data = lerDemonstracao()
    data.finances = data.finances.map(t => (t.id === id ? { ...t, ...updates } : t))
    gravarDemonstracao(data)
    return data.finances.find(t => t.id === id) as Transacao
  }

  static async excluirTransacao(id: string) {
    const data = lerDemonstracao()
    data.finances = data.finances.filter(t => t.id !== id)
    gravarDemonstracao(data)
  }

  static async obterSaldo() {
    const transactions = await this.listarTransacoes()
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      count: transactions.length
    }
  }

  static async listarTransacoesPorCategoria() {
    const transactions = await this.listarTransacoes()
    const categories: { [key: string]: { income: number; expense: number; count: number } } = {}
    transactions.forEach(t => {
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

  static async obterResumoDoMes(year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const transactions = (await this.listarTransacoes()).filter(t => t.date.startsWith(prefix))
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return { income, expenses, balance: income - expenses, count: transactions.length, transactions }
  }
}
