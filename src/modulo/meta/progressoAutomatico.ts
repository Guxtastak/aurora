/**
 * Junta as metas com os dados dos outros módulos e devolve tudo já calculado.
 *
 * É a única peça do módulo de metas que fala com livros, hábitos e finanças.
 * Ela busca os três uma vez só e aplica a regra a todas as metas.
 *
 * **O valor não é gravado, é recalculado toda vez.** Se ficasse gravado, toda
 * tela que mexe em livro, hábito ou transação teria que lembrar de atualizar as
 * metas afetadas — e no dia em que alguém esquecesse, a meta passaria a mentir
 * em silêncio. Por isso, para meta automática, o `current_value` e o
 * `progress_percentage` do banco não são autoridade: valem os campos daqui.
 */
import {
  ServicoDeMetas,
  ServicoDeLivros,
  ServicoDeHabitos,
  ServicoDeFinancas
} from '@/compartilhado/fonte/fonteDeDados'
import type { Meta } from '@/compartilhado/tipo/banco'
import { valorDaMeta, livrosSemDataDeConclusao } from '@/modulo/meta/regraDeOrigem'
import type { DadosDosModulos } from '@/modulo/meta/regraDeOrigem'
import { progressoDaMeta, resolverStatusDaMeta } from '@/modulo/meta/regraDeProgresso'
import { ehAutomatica } from '@/modulo/meta/origens'

export type MetaComProgresso = Meta & {
  /** Valor que vale agora: calculado para meta automática, gravado para manual */
  valorAtual: number
  progresso: number
  statusVivo: Meta['status']
  /** Meta de hábito cujo hábito foi apagado */
  habitoAusente: boolean
}

/** Janela larga o bastante para cobrir metas antigas sem carregar tudo */
const DIAS_DE_HISTORICO = 400

function inicioDoHistorico() {
  const data = new Date()
  data.setDate(data.getDate() - DIAS_DE_HISTORICO)
  const deslocamento = data.getTimezoneOffset() * 60000
  return new Date(data.getTime() - deslocamento).toISOString().split('T')[0]
}

export async function listarMetasComProgresso() {
  const [metas, livros, marcacoes, transacoes] = await Promise.all([
    ServicoDeMetas.listarMetas(),
    ServicoDeLivros.listarLivros(),
    ServicoDeHabitos.listarMarcacoesDesde(inicioDoHistorico()),
    ServicoDeFinancas.listarTransacoes()
  ])

  const dados: DadosDosModulos = { livros, marcacoes, transacoes }

  const comProgresso: MetaComProgresso[] = metas.map(meta => {
    const valorAtual = valorDaMeta(meta, dados)

    return {
      ...meta,
      valorAtual,
      progresso: progressoDaMeta(valorAtual, meta.target_value),
      statusVivo: resolverStatusDaMeta({
        current_value: valorAtual,
        target_value: meta.target_value,
        status: meta.status
      }),
      habitoAusente: meta.source === 'habit_checkins' && !meta.source_habit_id
    }
  })

  return {
    metas: comProgresso,
    /** Quantos livros finalizados não entram nas contas por falta de data */
    livrosSemData: comProgresso.some(meta => ehAutomatica(meta.source))
      ? livrosSemDataDeConclusao(dados)
      : 0
  }
}
