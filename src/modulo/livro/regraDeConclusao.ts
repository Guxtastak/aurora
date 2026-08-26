/**
 * Quando um livro tem data de conclusão, e qual.
 *
 * Pura e testada, como regraDeProgresso e regraDeOrigem: sem banco, sem React.
 *
 * A decisão mora aqui porque **livro finalizado sem data não conta em meta de
 * leitura** — a meta filtra por `finished_date` dentro da janela dela. Deixar o
 * campo escapar vazio cria um livro que o usuário vê como finalizado e a meta
 * ignora em silêncio. Por isso finalizar sem informar data assume hoje, em vez
 * de gravar nulo.
 *
 * O caminho de volta também importa: livro que deixa de estar finalizado perde
 * a data, senão continuaria contando na meta depois de voltar para a estante.
 */
import type { Livro } from '@/compartilhado/tipo/banco'
import { dataDeHoje } from '@/compartilhado/utilitario/formato'

export function dataDeConclusao(
  status: Livro['status'],
  dataInformada?: string | null,
  hoje: string = dataDeHoje()
): string | null {
  if (status !== 'finished') return null
  return dataInformada || hoje
}
