import { describe, it, expect } from 'vitest'
import { janelaDaMeta, valorDaMeta, livrosSemDataDeConclusao } from '@/modulo/meta/regraDeOrigem'
import type { DadosDosModulos } from '@/modulo/meta/regraDeOrigem'
import type { Meta, Livro, MarcacaoDeHabito, Transacao } from '@/compartilhado/tipo/banco'
import { paraDataISO, dataDeHoje } from '@/compartilhado/utilitario/formato'

function diasAtras(dias: number) {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return paraDataISO(data)
}

function meta(campos: Partial<Meta> = {}): Meta {
  return {
    id: 'meta-1',
    user_id: 'u1',
    title: 'Meta',
    target_value: 10,
    current_value: 0,
    unit: 'unidades',
    start_date: diasAtras(30),
    deadline: dataDeHoje(),
    category: 'reading',
    status: 'active',
    progress_percentage: 0,
    source: 'manual',
    source_habit_id: null,
    created_at: `${diasAtras(60)}T00:00:00.000Z`,
    updated_at: `${diasAtras(60)}T00:00:00.000Z`,
    ...campos
  }
}

function livro(campos: Partial<Livro> = {}): Livro {
  return {
    id: `livro-${Math.random()}`,
    user_id: 'u1',
    title: 'Livro',
    author: 'Autor',
    status: 'finished',
    pages_total: 100,
    pages_read: 100,
    finished_date: diasAtras(10),
    created_at: `${diasAtras(40)}T00:00:00.000Z`,
    updated_at: `${diasAtras(40)}T00:00:00.000Z`,
    ...campos
  }
}

function marcacao(date: string, habit_id = 'h1', completed = true): MarcacaoDeHabito {
  return {
    id: `marcacao-${habit_id}-${date}`,
    habit_id,
    user_id: 'u1',
    date,
    completed,
    created_at: `${date}T12:00:00.000Z`
  }
}

function transacao(date: string, type: Transacao['type'], amount: number): Transacao {
  return {
    id: `transacao-${date}-${amount}`,
    user_id: 'u1',
    date,
    type,
    category: 'Outros',
    amount,
    created_at: `${date}T12:00:00.000Z`
  }
}

function dados(campos: Partial<DadosDosModulos> = {}): DadosDosModulos {
  return { livros: [], marcacoes: [], transacoes: [], ...campos }
}

describe('janelaDaMeta', () => {
  it('usa o inicio e o prazo quando os dois estao preenchidos', () => {
    const janela = janelaDaMeta(meta({ start_date: '2026-01-01', deadline: '2026-06-30' }))

    expect(janela.inicio).toBe('2026-01-01')
    expect(janela.fim).toBe('2026-06-30')
  })

  it('sem inicio, comeca na criacao da meta', () => {
    const janela = janelaDaMeta(
      meta({ start_date: undefined, created_at: '2026-03-15T10:00:00.000Z' })
    )

    expect(janela.inicio).toBe('2026-03-15')
  })

  it('sem prazo, vai ate hoje', () => {
    expect(janelaDaMeta(meta({ deadline: undefined })).fim).toBe(dataDeHoje())
  })
})

describe('valorDaMeta', () => {
  it('origem manual devolve o valor gravado, sem olhar para os modulos', () => {
    const resultado = valorDaMeta(
      meta({ source: 'manual', current_value: 7 }),
      dados({ livros: [livro(), livro(), livro()] })
    )

    expect(resultado).toBe(7)
  })

  it('conta os livros finalizados dentro da janela', () => {
    const resultado = valorDaMeta(
      meta({ source: 'books_finished' }),
      dados({
        livros: [
          livro({ finished_date: diasAtras(5) }),
          livro({ finished_date: diasAtras(20) }),
          livro({ finished_date: diasAtras(90) }) // antes do inicio
        ]
      })
    )

    expect(resultado).toBe(2)
  })

  it('nao conta livro que ainda nao foi finalizado', () => {
    const resultado = valorDaMeta(
      meta({ source: 'books_finished' }),
      dados({ livros: [livro({ status: 'reading', finished_date: undefined })] })
    )

    expect(resultado).toBe(0)
  })

  it('nao conta livro finalizado sem data de conclusao', () => {
    const resultado = valorDaMeta(
      meta({ source: 'books_finished' }),
      dados({ livros: [livro({ status: 'finished', finished_date: undefined })] })
    )

    expect(resultado).toBe(0)
  })

  it('soma as paginas dos livros finalizados na janela', () => {
    const resultado = valorDaMeta(
      meta({ source: 'pages_read' }),
      dados({
        livros: [
          livro({ pages_total: 300, finished_date: diasAtras(5) }),
          livro({ pages_total: 200, finished_date: diasAtras(5) }),
          livro({ pages_total: 999, finished_date: diasAtras(90) })
        ]
      })
    )

    expect(resultado).toBe(500)
  })

  it('conta as marcacoes so do habito escolhido', () => {
    const resultado = valorDaMeta(
      meta({ source: 'habit_checkins', source_habit_id: 'h1' }),
      dados({
        marcacoes: [
          marcacao(diasAtras(1), 'h1'),
          marcacao(diasAtras(2), 'h1'),
          marcacao(diasAtras(3), 'h2')
        ]
      })
    )

    expect(resultado).toBe(2)
  })

  it('nao conta marcacao com completed falso', () => {
    const resultado = valorDaMeta(
      meta({ source: 'habit_checkins', source_habit_id: 'h1' }),
      dados({ marcacoes: [marcacao(diasAtras(1), 'h1'), marcacao(diasAtras(2), 'h1', false)] })
    )

    expect(resultado).toBe(1)
  })

  it('devolve zero quando o habito da meta foi apagado', () => {
    const resultado = valorDaMeta(
      meta({ source: 'habit_checkins', source_habit_id: null }),
      dados({ marcacoes: [marcacao(diasAtras(1), 'h1')] })
    )

    expect(resultado).toBe(0)
  })

  it('quanto guardei e entrada menos saida na janela', () => {
    const resultado = valorDaMeta(
      meta({ source: 'money_saved' }),
      dados({
        transacoes: [
          transacao(diasAtras(5), 'income', 1000),
          transacao(diasAtras(5), 'expense', 400),
          transacao(diasAtras(90), 'income', 9999) // fora da janela
        ]
      })
    )

    expect(resultado).toBe(600)
  })

  it('quanto guardei pode ser negativo', () => {
    const resultado = valorDaMeta(
      meta({ source: 'money_saved' }),
      dados({
        transacoes: [transacao(diasAtras(5), 'income', 100), transacao(diasAtras(5), 'expense', 250)]
      })
    )

    expect(resultado).toBe(-150)
  })

  it('quanto gastei soma so as saidas', () => {
    const resultado = valorDaMeta(
      meta({ source: 'money_spent' }),
      dados({
        transacoes: [transacao(diasAtras(5), 'income', 1000), transacao(diasAtras(5), 'expense', 400)]
      })
    )

    expect(resultado).toBe(400)
  })

  it('inclui os dias do inicio e do prazo (intervalo fechado)', () => {
    const inicio = diasAtras(10)
    const fim = diasAtras(2)

    const resultado = valorDaMeta(
      meta({ source: 'books_finished', start_date: inicio, deadline: fim }),
      dados({ livros: [livro({ finished_date: inicio }), livro({ finished_date: fim })] })
    )

    expect(resultado).toBe(2)
  })
})

describe('livrosSemDataDeConclusao', () => {
  it('conta os livros finalizados que ficariam de fora por falta de data', () => {
    const total = livrosSemDataDeConclusao(
      dados({
        livros: [
          livro({ status: 'finished', finished_date: undefined }),
          livro({ status: 'finished', finished_date: diasAtras(3) }),
          livro({ status: 'reading', finished_date: undefined })
        ]
      })
    )

    expect(total).toBe(1)
  })
})
