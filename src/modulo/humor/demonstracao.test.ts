/**
 * Testes do serviço de humor na versão de demonstração.
 *
 * Vale a pena testar esta versão e não a do Supabase por dois motivos: ela
 * roda sem banco e sem simulação nenhuma, e é ela que a prévia hospedada usa.
 * As regras que ela implementa — um registro por dia, gravar de novo edita —
 * são as mesmas que o serviço do banco implementa do outro lado.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { HumorDaDemonstracao } from '@/modulo/humor/demonstracao'
import { reiniciarDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { paraDataISO } from '@/compartilhado/utilitario/formato'

function diasAtras(dias: number) {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return paraDataISO(data)
}

beforeEach(() => {
  // Cada teste começa do seed original, sem herdar o que o anterior gravou
  reiniciarDemonstracao()
})

describe('HumorDaDemonstracao', () => {
  it('grava o humor de um dia e devolve o registro criado', async () => {
    const data = diasAtras(200) // fora da janela semeada, para nao colidir

    const criado = await HumorDaDemonstracao.gravarRegistroDoDia({
      date: data,
      mood: 4,
      energy: 5,
      notes: 'dia bom'
    })

    expect(criado.mood).toBe(4)
    expect(criado.energy).toBe(5)
    expect(criado.notes).toBe('dia bom')
    expect(criado.date).toBe(data)
  })

  it('gravar duas vezes no mesmo dia edita, nao duplica', async () => {
    const data = diasAtras(200)

    const primeiro = await HumorDaDemonstracao.gravarRegistroDoDia({ date: data, mood: 2, energy: 2 })
    const segundo = await HumorDaDemonstracao.gravarRegistroDoDia({ date: data, mood: 5, energy: 4 })

    expect(segundo.id).toBe(primeiro.id)
    expect(segundo.mood).toBe(5)

    const doDia = await HumorDaDemonstracao.buscarRegistroPorData(data)
    expect(doDia?.mood).toBe(5)
  })

  it('devolve null para um dia sem registro', async () => {
    expect(await HumorDaDemonstracao.buscarRegistroPorData(diasAtras(300))).toBeNull()
  })

  it('lista apenas os dias dentro da janela pedida', async () => {
    const dentro = await HumorDaDemonstracao.listarRegistrosDeHumor(7)
    const maisLonge = await HumorDaDemonstracao.listarRegistrosDeHumor(30)

    expect(dentro.length).toBeLessThanOrEqual(maisLonge.length)
    expect(dentro.every(registro => registro.date >= diasAtras(7))).toBe(true)
  })

  it('lista do mais recente para o mais antigo', async () => {
    const registros = await HumorDaDemonstracao.listarRegistrosDeHumor(30)
    const datas = registros.map(registro => registro.date)

    expect(datas).toEqual([...datas].sort().reverse())
  })

  it('exclui o registro pelo id', async () => {
    const data = diasAtras(200)
    const criado = await HumorDaDemonstracao.gravarRegistroDoDia({ date: data, mood: 3, energy: 3 })

    await HumorDaDemonstracao.excluirRegistro(criado.id)

    expect(await HumorDaDemonstracao.buscarRegistroPorData(data)).toBeNull()
  })
})
