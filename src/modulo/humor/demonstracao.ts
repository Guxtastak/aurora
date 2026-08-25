import type { DadosDoRegistro } from '@/modulo/humor/servico'
import type { RegistroDeHumor } from '@/compartilhado/tipo/banco'
import { agoraISO, gravarDemonstracao, lerDemonstracao, novoId, usuarioDaDemonstracao } from '@/compartilhado/fonte/armazenamentoDeDemonstracao'
import { dataDeHoje, paraDataISO } from '@/compartilhado/utilitario/formato'

/**
 * Humor no modo demonstração.
 *
 * Mesma lista de metodos do servico do lado (servico.ts), operando sobre o
 * localStorage em vez do Supabase. Quem escolhe entre os dois e o
 * compartilhado/fonte/fonteDeDados.ts.
 */
export class HumorDaDemonstracao {
  static async listarRegistrosDeHumor(days: number = 30) {
    const limite = new Date()
    limite.setDate(limite.getDate() - days)
    const desde = paraDataISO(limite)

    return lerDemonstracao()
      .mood_logs.filter(log => log.date >= desde)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  static async buscarRegistroPorData(date: string = dataDeHoje()) {
    return lerDemonstracao().mood_logs.find(log => log.date === date) || null
  }

  static async gravarRegistroDoDia(input: DadosDoRegistro) {
    const data = lerDemonstracao()
    const existing = data.mood_logs.find(log => log.date === input.date)

    if (existing) {
      const updated: RegistroDeHumor = { ...existing, ...input, updated_at: agoraISO() }
      data.mood_logs = data.mood_logs.map(log => (log.id === existing.id ? updated : log))
      gravarDemonstracao(data)
      return updated
    }

    const created: RegistroDeHumor = {
      ...input,
      id: novoId(),
      user_id: usuarioDaDemonstracao,
      created_at: agoraISO(),
      updated_at: agoraISO()
    }
    data.mood_logs = [created, ...data.mood_logs]
    gravarDemonstracao(data)
    return created
  }

  static async excluirRegistro(id: string) {
    const data = lerDemonstracao()
    data.mood_logs = data.mood_logs.filter(log => log.id !== id)
    gravarDemonstracao(data)
  }
}
