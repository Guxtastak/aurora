/**
 * Testes do serviço de metas na versão de demonstração.
 *
 * O foco é a costura: as regras de `regraDeProgresso` já têm teste próprio,
 * e aqui o que se prova é que o serviço realmente as aplica ao gravar — em
 * criação e em edição parcial, que é onde dava para errar em silêncio.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MetasDaDemonstracao } from '@/modulo/meta/demonstracao'
import { reiniciarDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import type { DadosDaMeta } from '@/modulo/meta/servico'

function meta(campos: Partial<DadosDaMeta> = {}): DadosDaMeta {
  return {
    title: 'Meta de teste',
    description: undefined,
    target_value: 10,
    current_value: 0,
    unit: 'unidades',
    start_date: undefined,
    deadline: undefined,
    category: 'habits',
    status: 'active',
    ...campos
  }
}

beforeEach(() => {
  reiniciarDemonstracao()
})

describe('MetasDaDemonstracao', () => {
  it('calcula o progresso ao criar, em vez de confiar no que a tela mandou', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta({ current_value: 3, target_value: 10 }))

    expect(criada.progress_percentage).toBe(30)
    expect(criada.status).toBe('active')
  })

  it('conclui a meta que ja nasce batendo o alvo', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta({ current_value: 10, target_value: 10 }))

    expect(criada.status).toBe('completed')
    expect(criada.progress_percentage).toBe(100)
  })

  it('meta sem alvo fica qualitativa: sem progresso e com o status escolhido', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(
      meta({ target_value: undefined, current_value: undefined, status: 'active' })
    )

    expect(criada.progress_percentage).toBe(0)
    expect(criada.status).toBe('active')
  })

  it('recalcula progresso e status quando so o valor atual e editado', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta({ current_value: 2, target_value: 10 }))

    // A tela manda so o campo que mudou; o alvo tem que vir da meta gravada
    const atualizada = await MetasDaDemonstracao.atualizarMeta(criada.id, { current_value: 10 })

    expect(atualizada.progress_percentage).toBe(100)
    expect(atualizada.status).toBe('completed')
  })

  it('reabre a meta concluida que caiu abaixo do alvo', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta({ current_value: 10, target_value: 10 }))
    expect(criada.status).toBe('completed')

    const reaberta = await MetasDaDemonstracao.atualizarMeta(criada.id, { current_value: 4 })

    expect(reaberta.status).toBe('active')
    expect(reaberta.progress_percentage).toBe(40)
  })

  it('nunca declara fracasso sozinho', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta({ current_value: 0, status: 'failed' }))

    // O status 'failed' e escolha do usuario, e o servico respeita
    expect(criada.status).toBe('failed')
  })

  it('exclui a meta', async () => {
    const criada = await MetasDaDemonstracao.criarMeta(meta())
    const antes = (await MetasDaDemonstracao.listarMetas()).length

    await MetasDaDemonstracao.excluirMeta(criada.id)

    expect((await MetasDaDemonstracao.listarMetas()).length).toBe(antes - 1)
  })
})
