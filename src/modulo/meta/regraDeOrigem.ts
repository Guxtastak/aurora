/**
 * De onde sai o número de uma meta automática.
 *
 * Puro e testado, no mesmo espírito de regraDeProgresso e regraDeComparacao:
 * recebe a meta e os dados brutos dos outros módulos e devolve o valor. Sem
 * banco, sem React.
 *
 * Duas decisões moram aqui:
 *
 *   - **a janela.** Só conta o que aconteceu entre o início e o prazo da meta.
 *     É o que faz "ler 24 livros no ano" significar este ano, e não a estante
 *     inteira. Sem início, vale a data de criação; sem prazo, vale hoje.
 *   - **dinheiro é acúmulo, não saldo.** "Quanto guardei" é entrada menos saída
 *     dentro da janela, e não o saldo da conta — senão uma meta criada hoje já
 *     nasceria batida por causa do dinheiro que você já tinha.
 */
import type { Meta, Livro, MarcacaoDeHabito, Transacao } from '@/compartilhado/tipo/banco'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'

export type DadosDosModulos = {
  livros: Livro[]
  marcacoes: MarcacaoDeHabito[]
  transacoes: Transacao[]
}

function dia(data: string) {
  return data.slice(0, 10)
}

/** Início e fim efetivos da meta, já resolvidos os campos vazios */
export function janelaDaMeta(meta: Meta) {
  return {
    inicio: dia(meta.start_date || meta.created_at),
    fim: dia(meta.deadline || dataDeHoje())
  }
}

function dentroDaJanela(data: string | undefined | null, janela: { inicio: string; fim: string }) {
  if (!data) return false
  const quando = dia(data)
  return quando >= janela.inicio && quando <= janela.fim
}

/** Livros finalizados dentro da janela. Sem finished_date, o livro não conta. */
function livrosFinalizados(dados: DadosDosModulos, janela: { inicio: string; fim: string }) {
  return dados.livros.filter(
    livro => livro.status === 'finished' && dentroDaJanela(livro.finished_date, janela)
  )
}

function transacoesDaJanela(dados: DadosDosModulos, janela: { inicio: string; fim: string }) {
  return dados.transacoes.filter(transacao => dentroDaJanela(transacao.date, janela))
}

function soma(valores: number[]) {
  return valores.reduce((total, valor) => total + valor, 0)
}

/**
 * Valor atual da meta. Para origem manual devolve o que está gravado — é o
 * usuário quem manda nesse número.
 */
export function valorDaMeta(meta: Meta, dados: DadosDosModulos): number {
  const janela = janelaDaMeta(meta)

  switch (meta.source) {
    case 'books_finished':
      return livrosFinalizados(dados, janela).length

    case 'pages_read':
      return soma(livrosFinalizados(dados, janela).map(livro => livro.pages_total || 0))

    case 'habit_checkins': {
      // Hábito apagado: o vínculo virou nulo e não há o que contar
      if (!meta.source_habit_id) return 0
      return dados.marcacoes.filter(
        marcacao =>
          marcacao.habit_id === meta.source_habit_id &&
          marcacao.completed &&
          dentroDaJanela(marcacao.date, janela)
      ).length
    }

    case 'money_saved': {
      const naJanela = transacoesDaJanela(dados, janela)
      const entradas = soma(
        naJanela.filter(t => t.type === 'income').map(t => Number(t.amount))
      )
      const saidas = soma(naJanela.filter(t => t.type === 'expense').map(t => Number(t.amount)))
      return entradas - saidas
    }

    case 'money_spent':
      return soma(
        transacoesDaJanela(dados, janela)
          .filter(t => t.type === 'expense')
          .map(t => Number(t.amount))
      )

    default:
      return meta.current_value || 0
  }
}

/**
 * Quantos livros finalizados ficam de fora das contas por não terem data de
 * conclusão. A tela usa isso para avisar, senão o usuário acha que o cálculo
 * quebrou quando o número vem baixo demais.
 */
export function livrosSemDataDeConclusao(dados: DadosDosModulos) {
  return dados.livros.filter(livro => livro.status === 'finished' && !livro.finished_date).length
}
