/**
 * De onde uma meta pode tirar o número dela.
 *
 * Isto é catálogo, não lógica: o rótulo que aparece na tela, a unidade que o
 * formulário sugere e a categoria que pré-seleciona cada origem. A conta em si
 * fica em regraDeOrigem.ts.
 */
import type { Meta, OrigemDaMeta } from '@/compartilhado/tipo/banco'

export type DescricaoDaOrigem = {
  id: OrigemDaMeta
  rotulo: string
  /** Frase curta que o formulário mostra no lugar do campo "Atual" */
  explicacao: string
  unidadeSugerida: string
  precisaDeHabito: boolean
  categoriaSugerida?: Meta['category']
}

export const ORIGENS: DescricaoDaOrigem[] = [
  {
    id: 'manual',
    rotulo: 'Eu atualizo na mão',
    explicacao: 'você digita o valor atual',
    unidadeSugerida: '',
    precisaDeHabito: false
  },
  {
    id: 'books_finished',
    rotulo: 'Livros finalizados',
    explicacao: 'conta os livros que você finalizou no período da meta',
    unidadeSugerida: 'livros',
    precisaDeHabito: false,
    categoriaSugerida: 'reading'
  },
  {
    id: 'pages_read',
    rotulo: 'Páginas lidas',
    explicacao: 'soma as páginas dos livros finalizados no período da meta',
    unidadeSugerida: 'páginas',
    precisaDeHabito: false
  },
  {
    id: 'habit_checkins',
    rotulo: 'Marcações de um hábito',
    explicacao: 'conta os dias em que você marcou o hábito escolhido',
    unidadeSugerida: 'dias',
    precisaDeHabito: true,
    categoriaSugerida: 'habits'
  },
  {
    id: 'money_saved',
    rotulo: 'Quanto guardei',
    explicacao: 'entradas menos saídas no período da meta',
    unidadeSugerida: 'R$',
    precisaDeHabito: false,
    categoriaSugerida: 'finance'
  },
  {
    id: 'money_spent',
    rotulo: 'Quanto gastei',
    explicacao: 'soma das saídas no período da meta',
    unidadeSugerida: 'R$',
    precisaDeHabito: false
  }
]

export function origemPorId(id: OrigemDaMeta): DescricaoDaOrigem {
  return ORIGENS.find(origem => origem.id === id) || ORIGENS[0]
}

/** A origem que o formulário pré-seleciona ao escolher uma categoria */
export function origemSugeridaPara(categoria: Meta['category']): OrigemDaMeta {
  return ORIGENS.find(origem => origem.categoriaSugerida === categoria)?.id || 'manual'
}

/** Meta automática é toda que não é manual */
export function ehAutomatica(origem: OrigemDaMeta) {
  return origem !== 'manual'
}
