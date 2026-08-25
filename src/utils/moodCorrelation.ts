import type { Habit, HabitLog, MoodLog } from '../types/database.types'

/**
 * Relação entre cumprir um hábito e como foi o dia. Fica aqui, fora do serviço,
 * porque vale igual para o Supabase e para o modo demonstração — e porque assim
 * dá para testá-la sem banco.
 *
 * O cálculo é uma diferença de médias, não um coeficiente: compara o humor
 * médio dos dias em que o hábito foi cumprido com o dos dias em que não foi.
 * É o que dá para dizer em uma frase na tela sem exigir estatística de quem lê.
 */

/** Dias com humor registrado necessários para a comparação valer alguma coisa */
export const MIN_DAYS = 5

/** Dias mínimos de cada lado — com um dia só, a "média" é aquele dia */
export const MIN_PER_GROUP = 2

export type MoodAverages = {
  mood: number
  energy: number
}

export type HabitMoodCorrelation = {
  habitId: string
  habitName: string
  /** Dias com humor registrado dentro da janela do hábito */
  days: number
  comHabito: MoodAverages
  semHabito: MoodAverages
  deltaMood: number
  deltaEnergy: number
  /** Amostra suficiente para exibir os números */
  enough: boolean
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averages(logs: MoodLog[]): MoodAverages {
  return {
    mood: average(logs.map(log => log.mood)),
    energy: average(logs.map(log => log.energy))
  }
}

function day(date: string) {
  return date.slice(0, 10)
}

function correlate(habit: Habit, logs: HabitLog[], moods: MoodLog[]): HabitMoodCorrelation {
  // Antes de o hábito existir, "não cumpriu" seria falso: a janela começa na criação
  const start = day(habit.created_at)
  const window = moods.filter(mood => day(mood.date) >= start)

  const completed = new Set(
    logs.filter(log => log.habit_id === habit.id && log.completed).map(log => day(log.date))
  )

  const com = window.filter(mood => completed.has(day(mood.date)))
  const sem = window.filter(mood => !completed.has(day(mood.date)))

  const comHabito = averages(com)
  const semHabito = averages(sem)
  const enough =
    window.length >= MIN_DAYS && com.length >= MIN_PER_GROUP && sem.length >= MIN_PER_GROUP

  return {
    habitId: habit.id,
    habitName: habit.name,
    days: window.length,
    comHabito,
    semHabito,
    // Sem amostra dos dois lados a diferença compara uma média com zero, o que
    // não significa nada — melhor zerar do que exibir um número inventado.
    deltaMood: enough ? comHabito.mood - semHabito.mood : 0,
    deltaEnergy: enough ? comHabito.energy - semHabito.energy : 0,
    enough
  }
}

/**
 * Uma linha por hábito diário, da maior para a menor diferença de humor. Hábito
 * sem amostra suficiente vem no fim, mas vem: a tela usa isso para dizer quantos
 * dias ainda faltam em vez de esconder o hábito.
 *
 * Hábito semanal ou mensal fica de fora — nele, "não cumpriu" é o estado normal
 * da maioria dos dias, e a comparação diria mais sobre a frequência do que sobre
 * o humor.
 */
export function habitMoodCorrelations(
  habits: Habit[],
  logs: HabitLog[],
  moods: MoodLog[]
): HabitMoodCorrelation[] {
  return habits
    .filter(habit => habit.frequency === 'daily')
    .map(habit => correlate(habit, logs, moods))
    .sort((a, b) => {
      if (a.enough !== b.enough) return a.enough ? -1 : 1
      return Math.abs(b.deltaMood) - Math.abs(a.deltaMood)
    })
}
