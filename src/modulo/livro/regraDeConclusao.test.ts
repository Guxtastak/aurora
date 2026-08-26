import { describe, it, expect } from 'vitest'
import { dataDeConclusao } from '@/modulo/livro/regraDeConclusao'

const HOJE = '2026-08-26'

describe('dataDeConclusao', () => {
  it('mantém a data informada quando o livro está finalizado', () => {
    expect(dataDeConclusao('finished', '2026-08-20', HOJE)).toBe('2026-08-20')
  })

  it('assume hoje quando o livro é finalizado sem data', () => {
    expect(dataDeConclusao('finished', undefined, HOJE)).toBe(HOJE)
  })

  it('assume hoje quando a data vem em branco do formulário', () => {
    expect(dataDeConclusao('finished', '', HOJE)).toBe(HOJE)
  })

  it('devolve nulo para livro que está sendo lido', () => {
    expect(dataDeConclusao('reading', undefined, HOJE)).toBeNull()
  })

  it('devolve nulo para livro que ainda não começou', () => {
    expect(dataDeConclusao('want_to_read', undefined, HOJE)).toBeNull()
  })

  it('devolve nulo para livro abandonado', () => {
    expect(dataDeConclusao('dropped', undefined, HOJE)).toBeNull()
  })

  // Desfazer a conclusão tem que limpar a data: livro que voltou a ser lido e
  // guardou a data antiga continuaria contando nas metas de leitura
  it('descarta a data quando o livro deixa de estar finalizado', () => {
    expect(dataDeConclusao('reading', '2026-08-20', HOJE)).toBeNull()
  })
})
