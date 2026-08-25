/**
 * Testes da regra de comparação entre hábito e humor.
 */
import { describe, it, expect } from 'vitest'
import { compararHabitosComHumor, MINIMO_DE_DIAS } from '@/modulo/humor/regraDeComparacao'
import type { Habito, MarcacaoDeHabito, RegistroDeHumor } from '@/compartilhado/tipo/banco'
import { paraDataISO } from '@/compartilhado/utilitario/formato'

function daysAgo(n: number) {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return paraDataISO(date)
}

function habit(over: Partial<Habito> = {}): Habito {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'Exercício',
    frequency: 'daily',
    target_count: 1,
    current_streak: 0,
    best_streak: 0,
    created_at: `${daysAgo(60)}T00:00:00.000Z`,
    updated_at: `${daysAgo(60)}T00:00:00.000Z`,
    ...over
  }
}

function mood(date: string, value: number, energy = value): RegistroDeHumor {
  return {
    id: `m-${date}`,
    user_id: 'u1',
    date,
    mood: value,
    energy,
    created_at: `${date}T12:00:00.000Z`,
    updated_at: `${date}T12:00:00.000Z`
  }
}

function log(date: string, completed = true, habit_id = 'h1'): MarcacaoDeHabito {
  return {
    id: `l-${habit_id}-${date}`,
    habit_id,
    user_id: 'u1',
    date,
    completed,
    created_at: `${date}T12:00:00.000Z`
  }
}

describe('compararHabitosComHumor', () => {
  it('compara a media dos dias em que o habito foi cumprido com a dos outros', () => {
    const moods = [
      mood(daysAgo(1), 4), mood(daysAgo(2), 4), mood(daysAgo(3), 4),
      mood(daysAgo(4), 2), mood(daysAgo(5), 2), mood(daysAgo(6), 2)
    ]
    const logs = [log(daysAgo(1)), log(daysAgo(2)), log(daysAgo(3))]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.comHabito.mood).toBe(4)
    expect(result.semHabito.mood).toBe(2)
    expect(result.deltaMood).toBe(2)
    expect(result.days).toBe(6)
    expect(result.enough).toBe(true)
  })

  it('devolve delta negativo quando o humor e pior nos dias com o habito', () => {
    const moods = [
      mood(daysAgo(1), 2), mood(daysAgo(2), 2), mood(daysAgo(3), 2),
      mood(daysAgo(4), 5), mood(daysAgo(5), 5), mood(daysAgo(6), 5)
    ]
    const logs = [log(daysAgo(1)), log(daysAgo(2)), log(daysAgo(3))]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.deltaMood).toBe(-3)
  })

  it('calcula a energia junto com o humor', () => {
    const moods = [
      mood(daysAgo(1), 3, 5), mood(daysAgo(2), 3, 5), mood(daysAgo(3), 3, 5),
      mood(daysAgo(4), 3, 1), mood(daysAgo(5), 3, 1), mood(daysAgo(6), 3, 1)
    ]
    const logs = [log(daysAgo(1)), log(daysAgo(2)), log(daysAgo(3))]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.deltaMood).toBe(0)
    expect(result.deltaEnergy).toBe(4)
  })

  it('trata log com completed falso como dia nao cumprido', () => {
    const moods = [
      mood(daysAgo(1), 4), mood(daysAgo(2), 4), mood(daysAgo(3), 4),
      mood(daysAgo(4), 2), mood(daysAgo(5), 2), mood(daysAgo(6), 2)
    ]
    // O dia 4 tem log, mas nao cumprido: precisa cair no grupo "sem habito"
    const logs = [log(daysAgo(1)), log(daysAgo(2)), log(daysAgo(3)), log(daysAgo(4), false)]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.comHabito.mood).toBe(4)
    expect(result.semHabito.mood).toBe(2)
  })

  it('ignora dias anteriores a criacao do habito', () => {
    const moods = Array.from({ length: 10 }, (_, i) => mood(daysAgo(i), 3))
    const criadoHa3Dias = habit({ created_at: `${daysAgo(3)}T00:00:00.000Z` })

    const [result] = compararHabitosComHumor([criadoHa3Dias], [], moods)

    // Dias 3, 2, 1 e 0 — os seis anteriores nao contam
    expect(result.days).toBe(4)
  })

  it('ignora habito que nao e diario', () => {
    const moods = Array.from({ length: 6 }, (_, i) => mood(daysAgo(i), 3))
    const semanal = habit({ id: 'h2', frequency: 'weekly' })
    const mensal = habit({ id: 'h3', frequency: 'monthly' })

    const result = compararHabitosComHumor([semanal, mensal], [], moods)

    expect(result).toHaveLength(0)
  })

  it('marca enough falso abaixo do minimo de dias', () => {
    const moods = [
      mood(daysAgo(1), 4), mood(daysAgo(2), 4),
      mood(daysAgo(3), 2), mood(daysAgo(4), 2)
    ]
    const logs = [log(daysAgo(1)), log(daysAgo(2))]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.days).toBeLessThan(MINIMO_DE_DIAS)
    expect(result.enough).toBe(false)
  })

  it('marca enough falso quando um dos grupos tem poucos dias', () => {
    const moods = [
      mood(daysAgo(1), 5),
      mood(daysAgo(2), 3), mood(daysAgo(3), 3), mood(daysAgo(4), 3),
      mood(daysAgo(5), 3), mood(daysAgo(6), 3)
    ]
    // Seis dias de humor, mas o habito so foi cumprido em um deles
    const logs = [log(daysAgo(1))]

    const [result] = compararHabitosComHumor([habit()], logs, moods)

    expect(result.days).toBeGreaterThanOrEqual(MINIMO_DE_DIAS)
    expect(result.enough).toBe(false)
  })

  it('devolve o habito com enough falso quando nao ha humor registrado', () => {
    const [result] = compararHabitosComHumor([habit()], [], [])

    expect(result.days).toBe(0)
    expect(result.enough).toBe(false)
    expect(result.deltaMood).toBe(0)
  })

  it('ordena por impacto, com os habitos sem amostra suficiente no fim', () => {
    const moods = [
      mood(daysAgo(1), 5), mood(daysAgo(2), 5), mood(daysAgo(3), 5),
      mood(daysAgo(4), 1), mood(daysAgo(5), 1), mood(daysAgo(6), 1)
    ]
    const forte = habit({ id: 'forte', name: 'Corrida' })
    const fraco = habit({ id: 'fraco', name: 'Leitura' })
    const semAmostra = habit({ id: 'sem', name: 'Meditação' })

    const logs = [
      // Corrida: cumprida exatamente nos dias bons -> delta 4
      log(daysAgo(1), true, 'forte'), log(daysAgo(2), true, 'forte'), log(daysAgo(3), true, 'forte'),
      // Leitura: dois dias bons e dois ruins -> delta 0
      log(daysAgo(1), true, 'fraco'), log(daysAgo(2), true, 'fraco'),
      log(daysAgo(4), true, 'fraco'), log(daysAgo(5), true, 'fraco'),
      // Meditacao: um dia so -> amostra insuficiente
      log(daysAgo(1), true, 'sem')
    ]

    const result = compararHabitosComHumor([fraco, semAmostra, forte], logs, moods)

    expect(result.map(r => r.habitId)).toEqual(['forte', 'fraco', 'sem'])
  })
})
