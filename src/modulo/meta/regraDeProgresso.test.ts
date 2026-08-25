import { describe, it, expect } from 'vitest'
import { progressoDaMeta, resolverStatusDaMeta, metaEstaAtrasada } from '@/modulo/meta/regraDeProgresso'
import { paraDataISO } from '@/compartilhado/utilitario/formato'

function daysFromToday(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return paraDataISO(date)
}

describe('progressoDaMeta', () => {
  it('calcula a porcentagem do valor atual sobre o alvo', () => {
    expect(progressoDaMeta(32, 50)).toBe(64)
  })

  it('arredonda para inteiro', () => {
    expect(progressoDaMeta(1, 3)).toBe(33)
  })

  it('limita em 100 quando o valor atual passa do alvo', () => {
    expect(progressoDaMeta(80, 50)).toBe(100)
  })

  it('nao devolve negativo', () => {
    expect(progressoDaMeta(-10, 50)).toBe(0)
  })

  it('devolve 0 para meta sem alvo (qualitativa)', () => {
    expect(progressoDaMeta(undefined, undefined)).toBe(0)
  })

  it('devolve 0 quando o alvo e zero, sem dividir por zero', () => {
    expect(progressoDaMeta(5, 0)).toBe(0)
  })
})

describe('resolverStatusDaMeta', () => {
  it('conclui a meta ativa que bateu o alvo', () => {
    expect(
      resolverStatusDaMeta({ current_value: 50, target_value: 50, status: 'active' })
    ).toBe('completed')
  })

  it('conclui tambem a meta que estava marcada como falha e bateu o alvo', () => {
    expect(
      resolverStatusDaMeta({ current_value: 60, target_value: 50, status: 'failed' })
    ).toBe('completed')
  })

  it('reabre a meta concluida cujo valor atual caiu abaixo do alvo', () => {
    expect(
      resolverStatusDaMeta({ current_value: 30, target_value: 50, status: 'completed' })
    ).toBe('active')
  })

  it('respeita a falha declarada pelo usuario quando o alvo nao foi batido', () => {
    expect(
      resolverStatusDaMeta({ current_value: 30, target_value: 50, status: 'failed' })
    ).toBe('failed')
  })

  it('nao automatiza o status de meta sem alvo: mantem o que o usuario escolheu', () => {
    expect(
      resolverStatusDaMeta({ current_value: undefined, target_value: undefined, status: 'completed' })
    ).toBe('completed')
  })
})

describe('metaEstaAtrasada', () => {
  it('aponta atraso na meta ativa com prazo vencido', () => {
    expect(metaEstaAtrasada({ deadline: daysFromToday(-1), status: 'active' })).toBe(true)
  })

  it('nao aponta atraso no dia do prazo', () => {
    expect(metaEstaAtrasada({ deadline: daysFromToday(0), status: 'active' })).toBe(false)
  })

  it('nao aponta atraso com prazo futuro', () => {
    expect(metaEstaAtrasada({ deadline: daysFromToday(30), status: 'active' })).toBe(false)
  })

  it('nao aponta atraso em meta sem prazo', () => {
    expect(metaEstaAtrasada({ deadline: undefined, status: 'active' })).toBe(false)
  })

  it('nao aponta atraso em meta ja concluida', () => {
    expect(metaEstaAtrasada({ deadline: daysFromToday(-10), status: 'completed' })).toBe(false)
  })
})
