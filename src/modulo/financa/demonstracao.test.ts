/**
 * Testes do serviço de finanças na versão de demonstração.
 *
 * O que se prova aqui é a conta: saldo é entrada menos saída, e cada operação
 * move o saldo na direção certa. Errar aqui é o tipo de defeito que ninguém vê
 * na tela — o número simplesmente fica errado.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { FinancasDaDemonstracao } from '@/modulo/financa/demonstracao'
import { reiniciarDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'

beforeEach(() => {
  reiniciarDemonstracao()
})

describe('FinancasDaDemonstracao', () => {
  it('saldo e a entrada menos a saida', async () => {
    const antes = await FinancasDaDemonstracao.obterSaldo()

    await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'income',
      category: 'Salário',
      amount: 1000,
      description: 'entrada de teste'
    })
    await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'expense',
      category: 'Lazer',
      amount: 250,
      description: 'saída de teste'
    })

    const depois = await FinancasDaDemonstracao.obterSaldo()

    // toBeCloseTo, e nao toBe: a soma e feita em ponto flutuante do JavaScript,
    // entao somar centavos pode devolver 4293.849999999999 em vez de 4293.85.
    // Na tela isso nao aparece, porque a formatacao arredonda em duas casas.
    expect(depois.totalIncome).toBeCloseTo(antes.totalIncome + 1000, 2)
    expect(depois.totalExpenses).toBeCloseTo(antes.totalExpenses + 250, 2)
    expect(depois.balance).toBeCloseTo(antes.balance + 750, 2)
    expect(depois.balance).toBeCloseTo(depois.totalIncome - depois.totalExpenses, 10)
  })

  it('excluir a transacao desfaz o efeito dela no saldo', async () => {
    const antes = await FinancasDaDemonstracao.obterSaldo()

    const criada = await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'expense',
      category: 'Outros',
      amount: 99.9
    })
    expect((await FinancasDaDemonstracao.obterSaldo()).balance).toBeCloseTo(antes.balance - 99.9, 2)

    await FinancasDaDemonstracao.excluirTransacao(criada.id)

    expect((await FinancasDaDemonstracao.obterSaldo()).balance).toBeCloseTo(antes.balance, 2)
  })

  it('conta o total de lancamentos', async () => {
    const antes = await FinancasDaDemonstracao.obterSaldo()

    await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'income',
      category: 'Freelance',
      amount: 10
    })

    expect((await FinancasDaDemonstracao.obterSaldo()).count).toBe(antes.count + 1)
  })

  it('filtra por periodo pelos limites, inclusive', async () => {
    const hoje = dataDeHoje()

    await FinancasDaDemonstracao.adicionarTransacao({
      date: hoje,
      type: 'income',
      category: 'Freelance',
      amount: 42
    })

    const doDia = await FinancasDaDemonstracao.listarTransacoesPorPeriodo(hoje, hoje)

    expect(doDia.length).toBeGreaterThan(0)
    expect(doDia.every(transacao => transacao.date === hoje)).toBe(true)
  })

  it('agrupa despesas por categoria somando os valores', async () => {
    await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'expense',
      category: 'CategoriaDeTeste',
      amount: 30
    })
    await FinancasDaDemonstracao.adicionarTransacao({
      date: dataDeHoje(),
      type: 'expense',
      category: 'CategoriaDeTeste',
      amount: 70
    })

    // O retorno é um mapa categoria -> { income, expense, count }
    const porCategoria = await FinancasDaDemonstracao.listarTransacoesPorCategoria()

    expect(porCategoria.CategoriaDeTeste.expense).toBe(100)
    expect(porCategoria.CategoriaDeTeste.income).toBe(0)
    expect(porCategoria.CategoriaDeTeste.count).toBe(2)
  })
})
