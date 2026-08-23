import type { Habit, HabitLog, Book, Finance, Insight } from '../../types/database.types'

/**
 * Armazenamento do modo demonstração: mantém os dados em localStorage para que a
 * prévia hospedada (GitHub Pages) funcione sem Supabase. Cada visitante tem sua
 * própria cópia dos dados, no próprio navegador.
 */

const STORAGE_KEY = 'aurora-demo-v1'
const DEMO_USER_ID = 'demo-user'

export interface DemoData {
  habits: Habit[]
  habit_logs: HabitLog[]
  books: Book[]
  finances: Finance[]
  insights: Insight[]
}

function iso(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

export function newId() {
  return `demo-${Math.random().toString(36).slice(2, 10)}`
}

function seed(): DemoData {
  const now = new Date().toISOString()

  const habitSeeds = [
    { name: 'Ler 20 páginas', icon: '📖', color: '#3a6bff', chance: 0.85 },
    { name: 'Treinar', icon: '💪', color: '#10b981', chance: 0.7 },
    { name: 'Meditar 10 min', icon: '🧘', color: '#8aa8ff', chance: 0.6 },
    { name: 'Beber 2L de água', icon: '💧', color: '#5a84ff', chance: 0.9 },
    { name: 'Estudar inglês', icon: '🎯', color: '#f59e0b', chance: 0.45 }
  ]

  const habits: Habit[] = []
  const habit_logs: HabitLog[] = []

  habitSeeds.forEach((item, index) => {
    const id = `demo-habit-${index + 1}`

    // Historico deterministico dos ultimos 45 dias (sem Math.random para o
    // grafico ficar estavel entre recarregamentos)
    const completedDays: string[] = []
    for (let day = 44; day >= 0; day--) {
      const pseudo = ((day * 7 + index * 13) % 10) / 10
      if (pseudo < item.chance) {
        const date = iso(daysAgo(day))
        completedDays.push(date)
        habit_logs.push({
          id: newId(),
          habit_id: id,
          user_id: DEMO_USER_ID,
          date,
          completed: true,
          created_at: now
        })
      }
    }

    // Sequencia atual: dias consecutivos terminando hoje ou ontem
    let currentStreak = 0
    const cursor = new Date()
    const sorted = [...completedDays].sort().reverse()
    if (sorted.length > 0 && sorted[0] !== iso(cursor)) {
      cursor.setDate(cursor.getDate() - 1)
    }
    for (const date of sorted) {
      if (date === iso(cursor)) {
        currentStreak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    habits.push({
      id,
      user_id: DEMO_USER_ID,
      name: item.name,
      icon: item.icon,
      color: item.color,
      frequency: 'daily',
      target_count: 1,
      current_streak: currentStreak,
      best_streak: Math.max(currentStreak, 4 + index),
      created_at: daysAgo(45 - index).toISOString(),
      updated_at: now
    })
  })

  const books: Book[] = [
    {
      id: 'demo-book-1',
      user_id: DEMO_USER_ID,
      title: 'O Poder do Hábito',
      author: 'Charles Duhigg',
      status: 'reading',
      pages_total: 408,
      pages_read: 236,
      started_date: iso(daysAgo(18)),
      created_at: daysAgo(18).toISOString(),
      updated_at: now
    },
    {
      id: 'demo-book-2',
      user_id: DEMO_USER_ID,
      title: 'Essencialismo',
      author: 'Greg McKeown',
      status: 'reading',
      pages_total: 272,
      pages_read: 64,
      started_date: iso(daysAgo(6)),
      created_at: daysAgo(6).toISOString(),
      updated_at: now
    },
    {
      id: 'demo-book-3',
      user_id: DEMO_USER_ID,
      title: 'Hábitos Atômicos',
      author: 'James Clear',
      status: 'finished',
      rating: 5,
      pages_total: 320,
      pages_read: 320,
      started_date: iso(daysAgo(70)),
      finished_date: iso(daysAgo(32)),
      created_at: daysAgo(70).toISOString(),
      updated_at: now
    },
    {
      id: 'demo-book-4',
      user_id: DEMO_USER_ID,
      title: 'A Coragem de Ser Imperfeito',
      author: 'Brené Brown',
      status: 'want_to_read',
      pages_total: 224,
      pages_read: 0,
      created_at: daysAgo(12).toISOString(),
      updated_at: now
    }
  ]

  const financeSeeds: Array<[number, Finance['type'], string, number, string]> = [
    [2, 'expense', 'Alimentação', 87.4, 'Mercado da semana'],
    [3, 'expense', 'Transporte', 42.9, 'Combustível'],
    [5, 'expense', 'Assinaturas', 39.9, 'Streaming'],
    [7, 'expense', 'Lazer', 120, 'Cinema e jantar'],
    [9, 'expense', 'Alimentação', 64.2, 'Feira'],
    [11, 'expense', 'Saúde', 180, 'Consulta'],
    [14, 'expense', 'Moradia', 1450, 'Aluguel'],
    [15, 'income', 'Salário', 6200, 'Salário do mês'],
    [16, 'income', 'Freelance', 1800, 'Projeto de site'],
    [18, 'expense', 'Educação', 249, 'Curso online'],
    [21, 'expense', 'Alimentação', 96.75, 'Mercado'],
    [24, 'expense', 'Transporte', 38.5, 'Aplicativo'],
    [27, 'expense', 'Lazer', 75, 'Show'],
    [33, 'expense', 'Moradia', 1450, 'Aluguel'],
    [34, 'income', 'Salário', 6200, 'Salário do mês'],
    [37, 'expense', 'Alimentação', 110.3, 'Mercado'],
    [40, 'expense', 'Assinaturas', 39.9, 'Streaming'],
    [43, 'income', 'Investimentos', 320.45, 'Dividendos']
  ]

  const finances: Finance[] = financeSeeds.map(([day, type, category, amount, description]) => ({
    id: newId(),
    user_id: DEMO_USER_ID,
    date: iso(daysAgo(day)),
    type,
    category,
    amount,
    description,
    created_at: daysAgo(day).toISOString()
  }))

  return { habits, habit_logs, books, finances, insights: [] }
}

let cache: DemoData | null = null

export function readDemo(): DemoData {
  if (cache) return cache
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      cache = JSON.parse(stored) as DemoData
      return cache
    }
  } catch {
    // localStorage indisponivel (modo privado): segue em memoria
  }
  cache = seed()
  writeDemo(cache)
  return cache
}

export function writeDemo(data: DemoData) {
  cache = data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // sem persistencia: os dados vivem apenas nesta sessao
  }
}

export function resetDemo() {
  cache = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignora
  }
  return readDemo()
}

export function demoToday() {
  return iso(new Date())
}

export const demoUserId = DEMO_USER_ID
