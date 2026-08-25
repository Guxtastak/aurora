import type { Habito, HabitoNoBanco, MarcacaoDeHabito, Livro, Transacao, Meta, RegistroDeHumor, Insight } from '@/compartilhado/tipo/banco'
import { lerDemonstracao, gravarDemonstracao, novoId, hojeNaDemonstracao, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { ServicoDeLivros } from '@/modulo/livro/servico'
import { ServicoDeFinancas } from '@/modulo/financa/servico'
import type { DadosDaMeta } from '@/modulo/meta/servico'
import type { DadosDoRegistro } from '@/modulo/humor/servico'
import { paraDataISO, dataDeHoje } from '@/compartilhado/utilitario/formato'
import { progressoDaMeta, resolverStatusDaMeta } from '@/modulo/meta/regraDeProgresso'
import { compararHabitosComHumor } from '@/modulo/humor/regraDeComparacao'

/**
 * Versões dos serviços que operam sobre o demoStore, com as mesmas assinaturas
 * usadas pela interface. A troca acontece em src/services/data.ts.
 */

function nowISO() {
  return new Date().toISOString()
}

function recalcStreaks(habitId: string) {
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
      created_at: nowISO(),
      updated_at: nowISO()
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
      h.id === id ? { ...h, ...updates, updated_at: nowISO() } : h
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
        created_at: nowISO()
      }
      data.habit_logs = [...data.habit_logs, log]
    }

    gravarDemonstracao(data)
    recalcStreaks(habitId)
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
    return recalcStreaks(habitId)
  }
}

export class LivrosDaDemonstracao {
  // A busca no Google Books é uma API pública: continua usando a implementação real
  static buscarNoGoogleBooks = ServicoDeLivros.buscarNoGoogleBooks.bind(ServicoDeLivros)

  static async listarLivros() {
    return [...lerDemonstracao().books].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async listarLivrosPorStatus(status: Livro['status']) {
    return (await this.listarLivros()).filter(b => b.status === status)
  }

  static async buscarLivroPorId(id: string) {
    return lerDemonstracao().books.find(b => b.id === id) as Livro
  }

  static async adicionarLivro(book: Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const data = lerDemonstracao()
    const created: Livro = {
      ...book,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.books = [created, ...data.books]
    gravarDemonstracao(data)
    return created
  }

  static async adicionarLivroDoGoogle(googleBookId: string) {
    const results = await ServicoDeLivros.buscarNoGoogleBooks(`id:${googleBookId}`, 1).catch(() => [])
    const volume = results[0]?.volumeInfo

    return this.adicionarLivro({
      title: volume?.title || 'Livro adicionado',
      author: volume?.authors?.[0] || 'Autor desconhecido',
      cover_url: volume?.imageLinks?.thumbnail || '',
      pages_total: volume?.pageCount || 0,
      pages_read: 0,
      google_books_id: googleBookId,
      status: 'reading',
      started_date: hojeNaDemonstracao()
    })
  }

  static async atualizarLivro(id: string, updates: Partial<Omit<Livro, 'id' | 'created_at' | 'updated_at'>>) {
    const data = lerDemonstracao()
    data.books = data.books.map(b => (b.id === id ? { ...b, ...updates, updated_at: nowISO() } : b))
    gravarDemonstracao(data)
    return data.books.find(b => b.id === id) as Livro
  }

  static async atualizarProgresso(id: string, pagesRead: number) {
    return this.atualizarLivro(id, { pages_read: pagesRead })
  }

  static async finalizarLivro(id: string, rating?: number) {
    return this.atualizarLivro(id, {
      status: 'finished',
      finished_date: hojeNaDemonstracao(),
      ...(rating ? { rating } : {})
    })
  }

  static async excluirLivro(id: string) {
    const data = lerDemonstracao()
    data.books = data.books.filter(b => b.id !== id)
    gravarDemonstracao(data)
  }

  static async obterEstatisticasDeLeitura() {
    const books = await this.listarLivros()
    const finished = books.filter(b => b.status === 'finished')
    return {
      total: books.length,
      reading: books.filter(b => b.status === 'reading').length,
      finished: finished.length,
      totalPagesRead: finished.reduce((sum, b) => sum + (b.pages_total || 0), 0),
      averageRating: finished.reduce((sum, b) => sum + (b.rating || 0), 0) / (finished.length || 1)
    }
  }
}

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
      created_at: nowISO()
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

export class MetasDaDemonstracao {
  static async listarMetas() {
    return [...lerDemonstracao().goals].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async buscarMetaPorId(id: string) {
    return lerDemonstracao().goals.find(g => g.id === id) as Meta
  }

  static async criarMeta(goal: DadosDaMeta) {
    const data = lerDemonstracao()
    const created: Meta = {
      ...goal,
      status: resolverStatusDaMeta(goal),
      progress_percentage: progressoDaMeta(goal.current_value, goal.target_value),
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.goals = [created, ...data.goals]
    gravarDemonstracao(data)
    return created
  }

  static async atualizarMeta(id: string, updates: Partial<DadosDaMeta>) {
    const data = lerDemonstracao()
    let updated: Meta | undefined

    data.goals = data.goals.map(g => {
      if (g.id !== id) return g
      const merged = { ...g, ...updates }
      updated = {
        ...merged,
        status: resolverStatusDaMeta(merged),
        progress_percentage: progressoDaMeta(merged.current_value, merged.target_value),
        updated_at: nowISO()
      }
      return updated
    })

    gravarDemonstracao(data)
    return updated as Meta
  }

  static async excluirMeta(id: string) {
    const data = lerDemonstracao()
    data.goals = data.goals.filter(g => g.id !== id)
    gravarDemonstracao(data)
  }
}

export class HumorDaDemonstracao {
  static async listarRegistrosDeHumor(days: number = 30) {
    const limite = new Date()
    limite.setDate(limite.getDate() - days)
    const desde = paraDataISO(limite)

    return lerDemonstracao()
      .mood_logs.filter(log => log.date >= desde)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  static async buscarRegistroPorData(date: string = dataDeHoje()) {
    return lerDemonstracao().mood_logs.find(log => log.date === date) || null
  }

  static async gravarRegistroDoDia(input: DadosDoRegistro) {
    const data = lerDemonstracao()
    const existing = data.mood_logs.find(log => log.date === input.date)

    if (existing) {
      const updated: RegistroDeHumor = { ...existing, ...input, updated_at: nowISO() }
      data.mood_logs = data.mood_logs.map(log => (log.id === existing.id ? updated : log))
      gravarDemonstracao(data)
      return updated
    }

    const created: RegistroDeHumor = {
      ...input,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.mood_logs = [created, ...data.mood_logs]
    gravarDemonstracao(data)
    return created
  }

  static async excluirRegistro(id: string) {
    const data = lerDemonstracao()
    data.mood_logs = data.mood_logs.filter(log => log.id !== id)
    gravarDemonstracao(data)
  }
}

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
      generated_at: nowISO()
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
