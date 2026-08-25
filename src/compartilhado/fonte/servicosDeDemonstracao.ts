import type { Habit, HabitRow, HabitLog, Book, Finance, Goal, MoodLog, Insight } from '@/compartilhado/tipo/banco'
import { readDemo, writeDemo, newId, demoToday, demoUserId } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { BookService } from '@/modulo/livro/servico'
import { FinanceService } from '@/modulo/financa/servico'
import type { GoalInput } from '@/modulo/meta/servico'
import type { MoodInput } from '@/modulo/humor/servico'
import { toISODate, todayISO } from '@/compartilhado/utilitario/formato'
import { goalProgress, resolveGoalStatus } from '@/modulo/meta/regraDeProgresso'
import { habitMoodCorrelations } from '@/modulo/humor/regraDeComparacao'

/**
 * Versões dos serviços que operam sobre o demoStore, com as mesmas assinaturas
 * usadas pela interface. A troca acontece em src/services/data.ts.
 */

function nowISO() {
  return new Date().toISOString()
}

function recalcStreaks(habitId: string) {
  const data = readDemo()
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
  writeDemo(data)
  return data.habits.find(h => h.id === habitId) as Habit
}

export class DemoHabitService {
  static async getHabits() {
    return [...readDemo().habits].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async getHabitsWithTodayStatus() {
    const data = readDemo()
    const today = demoToday()
    const done = new Set(
      data.habit_logs.filter(l => l.date === today && l.completed).map(l => l.habit_id)
    )
    return (await this.getHabits()).map(h => ({ ...h, completed_today: done.has(h.id) }))
  }

  static async getHabitById(id: string) {
    return readDemo().habits.find(h => h.id === id) as Habit
  }

  static async createHabit(
    habit: Omit<HabitRow, 'id' | 'created_at' | 'updated_at' | 'current_streak' | 'best_streak' | 'user_id'>
  ) {
    const data = readDemo()
    const created: Habit = {
      ...habit,
      id: newId(),
      user_id: demoUserId,
      current_streak: 0,
      best_streak: 0,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.habits = [created, ...data.habits]
    writeDemo(data)
    return created
  }

  static async updateHabit(
    id: string,
    updates: Partial<Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'completed_today'>>
  ) {
    const data = readDemo()
    data.habits = data.habits.map(h =>
      h.id === id ? { ...h, ...updates, updated_at: nowISO() } : h
    )
    writeDemo(data)
    return data.habits.find(h => h.id === id) as Habit
  }

  static async deleteHabit(id: string) {
    const data = readDemo()
    data.habits = data.habits.filter(h => h.id !== id)
    data.habit_logs = data.habit_logs.filter(l => l.habit_id !== id)
    writeDemo(data)
  }

  static async toggleTodayHabit(habitId: string) {
    return this.toggleHabitOnDate(habitId, demoToday())
  }

  static async toggleHabitOnDate(habitId: string, date: string) {
    const data = readDemo()
    const existing = data.habit_logs.find(l => l.habit_id === habitId && l.date === date)

    let log: HabitLog
    if (existing) {
      log = { ...existing, completed: !existing.completed }
      data.habit_logs = data.habit_logs.map(l => (l.id === existing.id ? log : l))
    } else {
      log = {
        id: newId(),
        habit_id: habitId,
        user_id: demoUserId,
        date,
        completed: true,
        created_at: nowISO()
      }
      data.habit_logs = [...data.habit_logs, log]
    }

    writeDemo(data)
    recalcStreaks(habitId)
    return log
  }

  static async getHabitLogs(habitId: string, limit?: number) {
    const logs = readDemo()
      .habit_logs.filter(l => l.habit_id === habitId)
      .sort((a, b) => b.date.localeCompare(a.date))
    return limit ? logs.slice(0, limit) : logs
  }

  static async getLogsSince(startDate: string) {
    return readDemo()
      .habit_logs.filter(l => l.completed && l.date >= startDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  static async updateStreak(habitId: string) {
    return recalcStreaks(habitId)
  }
}

export class DemoBookService {
  // A busca no Google Books é uma API pública: continua usando a implementação real
  static searchGoogleBooks = BookService.searchGoogleBooks.bind(BookService)

  static async getBooks() {
    return [...readDemo().books].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async getBooksByStatus(status: Book['status']) {
    return (await this.getBooks()).filter(b => b.status === status)
  }

  static async getBookById(id: string) {
    return readDemo().books.find(b => b.id === id) as Book
  }

  static async addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const data = readDemo()
    const created: Book = {
      ...book,
      id: newId(),
      user_id: demoUserId,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.books = [created, ...data.books]
    writeDemo(data)
    return created
  }

  static async addBookFromGoogle(googleBookId: string) {
    const results = await BookService.searchGoogleBooks(`id:${googleBookId}`, 1).catch(() => [])
    const volume = results[0]?.volumeInfo

    return this.addBook({
      title: volume?.title || 'Livro adicionado',
      author: volume?.authors?.[0] || 'Autor desconhecido',
      cover_url: volume?.imageLinks?.thumbnail || '',
      pages_total: volume?.pageCount || 0,
      pages_read: 0,
      google_books_id: googleBookId,
      status: 'reading',
      started_date: demoToday()
    })
  }

  static async updateBook(id: string, updates: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>) {
    const data = readDemo()
    data.books = data.books.map(b => (b.id === id ? { ...b, ...updates, updated_at: nowISO() } : b))
    writeDemo(data)
    return data.books.find(b => b.id === id) as Book
  }

  static async updateProgress(id: string, pagesRead: number) {
    return this.updateBook(id, { pages_read: pagesRead })
  }

  static async finishBook(id: string, rating?: number) {
    return this.updateBook(id, {
      status: 'finished',
      finished_date: demoToday(),
      ...(rating ? { rating } : {})
    })
  }

  static async deleteBook(id: string) {
    const data = readDemo()
    data.books = data.books.filter(b => b.id !== id)
    writeDemo(data)
  }

  static async getReadingStats() {
    const books = await this.getBooks()
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

export class DemoFinanceService {
  // Cotação vem de uma API pública, sem relação com o Supabase
  static getExchangeRate = FinanceService.getExchangeRate.bind(FinanceService)

  static async getTransactions() {
    return [...readDemo().finances].sort((a, b) => b.date.localeCompare(a.date))
  }

  static async getTransactionsByPeriod(startDate: string, endDate: string) {
    return (await this.getTransactions()).filter(t => t.date >= startDate && t.date <= endDate)
  }

  static async addTransaction(transaction: Omit<Finance, 'id' | 'created_at' | 'user_id'>) {
    const data = readDemo()
    const created: Finance = {
      ...transaction,
      id: newId(),
      user_id: demoUserId,
      created_at: nowISO()
    }
    data.finances = [created, ...data.finances]
    writeDemo(data)
    return created
  }

  static async updateTransaction(id: string, updates: Partial<Omit<Finance, 'id' | 'created_at'>>) {
    const data = readDemo()
    data.finances = data.finances.map(t => (t.id === id ? { ...t, ...updates } : t))
    writeDemo(data)
    return data.finances.find(t => t.id === id) as Finance
  }

  static async deleteTransaction(id: string) {
    const data = readDemo()
    data.finances = data.finances.filter(t => t.id !== id)
    writeDemo(data)
  }

  static async getBalance() {
    const transactions = await this.getTransactions()
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

  static async getTransactionsByCategory() {
    const transactions = await this.getTransactions()
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

  static async getMonthlySummary(year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const transactions = (await this.getTransactions()).filter(t => t.date.startsWith(prefix))
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return { income, expenses, balance: income - expenses, count: transactions.length, transactions }
  }
}

export class DemoGoalService {
  static async getGoals() {
    return [...readDemo().goals].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  static async getGoalById(id: string) {
    return readDemo().goals.find(g => g.id === id) as Goal
  }

  static async createGoal(goal: GoalInput) {
    const data = readDemo()
    const created: Goal = {
      ...goal,
      status: resolveGoalStatus(goal),
      progress_percentage: goalProgress(goal.current_value, goal.target_value),
      id: newId(),
      user_id: demoUserId,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.goals = [created, ...data.goals]
    writeDemo(data)
    return created
  }

  static async updateGoal(id: string, updates: Partial<GoalInput>) {
    const data = readDemo()
    let updated: Goal | undefined

    data.goals = data.goals.map(g => {
      if (g.id !== id) return g
      const merged = { ...g, ...updates }
      updated = {
        ...merged,
        status: resolveGoalStatus(merged),
        progress_percentage: goalProgress(merged.current_value, merged.target_value),
        updated_at: nowISO()
      }
      return updated
    })

    writeDemo(data)
    return updated as Goal
  }

  static async deleteGoal(id: string) {
    const data = readDemo()
    data.goals = data.goals.filter(g => g.id !== id)
    writeDemo(data)
  }
}

export class DemoMoodService {
  static async getMoodLogs(days: number = 30) {
    const limite = new Date()
    limite.setDate(limite.getDate() - days)
    const desde = toISODate(limite)

    return readDemo()
      .mood_logs.filter(log => log.date >= desde)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  static async getMoodByDate(date: string = todayISO()) {
    return readDemo().mood_logs.find(log => log.date === date) || null
  }

  static async saveMood(input: MoodInput) {
    const data = readDemo()
    const existing = data.mood_logs.find(log => log.date === input.date)

    if (existing) {
      const updated: MoodLog = { ...existing, ...input, updated_at: nowISO() }
      data.mood_logs = data.mood_logs.map(log => (log.id === existing.id ? updated : log))
      writeDemo(data)
      return updated
    }

    const created: MoodLog = {
      ...input,
      id: newId(),
      user_id: demoUserId,
      created_at: nowISO(),
      updated_at: nowISO()
    }
    data.mood_logs = [created, ...data.mood_logs]
    writeDemo(data)
    return created
  }

  static async deleteMood(id: string) {
    const data = readDemo()
    data.mood_logs = data.mood_logs.filter(log => log.id !== id)
    writeDemo(data)
  }
}

export class DemoInsightService {
  static async generateDailyInsights() {
    const [habits, books, balance] = await Promise.all([
      DemoHabitService.getHabitsWithTodayStatus(),
      DemoBookService.getBooks(),
      DemoFinanceService.getBalance()
    ])

    const today = demoToday()
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

    const data = readDemo()
    const created: Insight = {
      id: newId(),
      user_id: demoUserId,
      title: `Resumo Diário - ${today}`,
      description: 'Análise do dia atual',
      type: 'daily',
      metadata,
      generated_at: nowISO()
    }
    data.insights = [created, ...data.insights]
    writeDemo(data)
    return created
  }

  static async getInsights(limit: number = 10) {
    return readDemo()
      .insights.slice()
      .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
      .slice(0, limit)
  }

  static async getHabitCorrelations(days: number = 90) {
    const desde = new Date()
    desde.setDate(desde.getDate() - days)
    const inicio = toISODate(desde)
    const data = readDemo()

    return habitMoodCorrelations(
      data.habits,
      data.habit_logs,
      data.mood_logs.filter(log => log.date >= inicio)
    )
  }
}
