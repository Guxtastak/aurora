import { describe, it, expect } from 'vitest'
import { goalProgress, resolveGoalStatus, isGoalOverdue } from './goalProgress'
import { toISODate } from './format'

function daysFromToday(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

describe('goalProgress', () => {
  it('calcula a porcentagem do valor atual sobre o alvo', () => {
    expect(goalProgress(32, 50)).toBe(64)
  })

  it('arredonda para inteiro', () => {
    expect(goalProgress(1, 3)).toBe(33)
  })

  it('limita em 100 quando o valor atual passa do alvo', () => {
    expect(goalProgress(80, 50)).toBe(100)
  })

  it('nao devolve negativo', () => {
    expect(goalProgress(-10, 50)).toBe(0)
  })

  it('devolve 0 para meta sem alvo (qualitativa)', () => {
    expect(goalProgress(undefined, undefined)).toBe(0)
  })

  it('devolve 0 quando o alvo e zero, sem dividir por zero', () => {
    expect(goalProgress(5, 0)).toBe(0)
  })
})

describe('resolveGoalStatus', () => {
  it('conclui a meta ativa que bateu o alvo', () => {
    expect(
      resolveGoalStatus({ current_value: 50, target_value: 50, status: 'active' })
    ).toBe('completed')
  })

  it('conclui tambem a meta que estava marcada como falha e bateu o alvo', () => {
    expect(
      resolveGoalStatus({ current_value: 60, target_value: 50, status: 'failed' })
    ).toBe('completed')
  })

  it('reabre a meta concluida cujo valor atual caiu abaixo do alvo', () => {
    expect(
      resolveGoalStatus({ current_value: 30, target_value: 50, status: 'completed' })
    ).toBe('active')
  })

  it('respeita a falha declarada pelo usuario quando o alvo nao foi batido', () => {
    expect(
      resolveGoalStatus({ current_value: 30, target_value: 50, status: 'failed' })
    ).toBe('failed')
  })

  it('nao automatiza o status de meta sem alvo: mantem o que o usuario escolheu', () => {
    expect(
      resolveGoalStatus({ current_value: undefined, target_value: undefined, status: 'completed' })
    ).toBe('completed')
  })
})

describe('isGoalOverdue', () => {
  it('aponta atraso na meta ativa com prazo vencido', () => {
    expect(isGoalOverdue({ deadline: daysFromToday(-1), status: 'active' })).toBe(true)
  })

  it('nao aponta atraso no dia do prazo', () => {
    expect(isGoalOverdue({ deadline: daysFromToday(0), status: 'active' })).toBe(false)
  })

  it('nao aponta atraso com prazo futuro', () => {
    expect(isGoalOverdue({ deadline: daysFromToday(30), status: 'active' })).toBe(false)
  })

  it('nao aponta atraso em meta sem prazo', () => {
    expect(isGoalOverdue({ deadline: undefined, status: 'active' })).toBe(false)
  })

  it('nao aponta atraso em meta ja concluida', () => {
    expect(isGoalOverdue({ deadline: daysFromToday(-10), status: 'completed' })).toBe(false)
  })
})
