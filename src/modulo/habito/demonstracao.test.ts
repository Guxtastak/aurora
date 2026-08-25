/**
 * Testes do serviço de hábitos na versão de demonstração.
 *
 * A parte delicada aqui é a sequência: ela é recalculada a cada marcação e
 * tem duas regras que dá para errar sem ninguém perceber — o dia de hoje ainda
 * não marcado não pode zerar a sequência de quem marcou ontem, e o recorde
 * nunca pode diminuir.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { HabitosDaDemonstracao } from '@/modulo/habito/demonstracao'
import { reiniciarDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { paraDataISO, dataDeHoje } from '@/compartilhado/utilitario/formato'

function diasAtras(dias: number) {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return paraDataISO(data)
}

async function habitoNovo(nome = 'Hábito de teste') {
  return HabitosDaDemonstracao.criarHabito({
    name: nome,
    description: undefined,
    icon: '🎯',
    color: '#3a6bff',
    frequency: 'daily',
    target_count: 1
  })
}

beforeEach(() => {
  reiniciarDemonstracao()
})

describe('HabitosDaDemonstracao', () => {
  it('marca o habito de hoje e desmarca no segundo clique', async () => {
    const habito = await habitoNovo()

    await HabitosDaDemonstracao.alternarHabitoDeHoje(habito.id)
    let comStatus = await HabitosDaDemonstracao.listarHabitosComStatusDeHoje()
    expect(comStatus.find(h => h.id === habito.id)?.completed_today).toBe(true)

    await HabitosDaDemonstracao.alternarHabitoDeHoje(habito.id)
    comStatus = await HabitosDaDemonstracao.listarHabitosComStatusDeHoje()
    expect(comStatus.find(h => h.id === habito.id)?.completed_today).toBe(false)
  })

  it('conta a sequencia de dias seguidos terminando hoje', async () => {
    const habito = await habitoNovo()

    for (const dia of [2, 1, 0]) {
      await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(dia))
    }

    const atualizado = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(atualizado?.current_streak).toBe(3)
  })

  it('nao zera a sequencia so porque hoje ainda nao foi marcado', async () => {
    const habito = await habitoNovo()

    // Marcou ontem e anteontem; hoje o dia ainda nem acabou
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(2))
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(1))

    const atualizado = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(atualizado?.current_streak).toBe(2)
  })

  it('quebra a sequencia quando ha um dia sem marcacao no meio', async () => {
    const habito = await habitoNovo()

    // Marcou hoje e ontem, pulou anteontem, marcou tres dias atras
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(3))
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(1))
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, dataDeHoje())

    const atualizado = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(atualizado?.current_streak).toBe(2)
  })

  it('guarda o recorde mesmo depois de a sequencia atual quebrar', async () => {
    const habito = await habitoNovo()

    // Cinco dias seguidos ha um tempo, e nada desde entao
    for (const dia of [10, 9, 8, 7, 6]) {
      await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(dia))
    }

    const atualizado = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(atualizado?.current_streak).toBe(0)
    expect(atualizado?.best_streak).toBe(5)
  })

  it('o recorde acompanha o historico: desmarcar um dia refaz a conta', async () => {
    const habito = await habitoNovo()

    for (const dia of [4, 3, 2, 1, 0]) {
      await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(dia))
    }
    expect((await HabitosDaDemonstracao.buscarHabitoPorId(habito.id))?.best_streak).toBe(5)

    // Desmarcar o dia do meio parte a corrida em duas: 2 e 2
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(2))

    const partido = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(partido?.current_streak).toBe(2)
    expect(partido?.best_streak).toBe(2)

    // E marcar de volta devolve o recorde: ele e derivado do historico, nao um
    // numero guardado. Quem marcou por engano e corrigiu nao fica com um
    // recorde inflado para sempre.
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(2))

    const restaurado = await HabitosDaDemonstracao.buscarHabitoPorId(habito.id)
    expect(restaurado?.current_streak).toBe(5)
    expect(restaurado?.best_streak).toBe(5)
  })

  it('excluir o habito leva as marcacoes dele junto', async () => {
    const habito = await habitoNovo()
    await HabitosDaDemonstracao.alternarHabitoDeHoje(habito.id)

    await HabitosDaDemonstracao.excluirHabito(habito.id)

    expect(await HabitosDaDemonstracao.listarMarcacoesDoHabito(habito.id)).toEqual([])
  })

  it('lista as marcacoes a partir de uma data', async () => {
    const habito = await habitoNovo()
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, diasAtras(10))
    await HabitosDaDemonstracao.alternarHabitoNaData(habito.id, dataDeHoje())

    const recentes = await HabitosDaDemonstracao.listarMarcacoesDesde(diasAtras(3))
    const desteHabito = recentes.filter(marcacao => marcacao.habit_id === habito.id)

    expect(desteHabito).toHaveLength(1)
    expect(desteHabito[0].date).toBe(dataDeHoje())
  })
})
