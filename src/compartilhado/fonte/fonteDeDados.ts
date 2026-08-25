/**
 * De onde os dados vêm.
 *
 * O app tem duas implementações de cada serviço:
 *
 *   - a real, que fala com o Supabase (em `modulo/<assunto>/servico.ts`);
 *   - a de demonstração, que guarda tudo no localStorage do visitante
 *     (em `servicosDeDemonstracao.ts`), usada quando não há credenciais.
 *
 * As duas têm exatamente os mesmos métodos, com os mesmos parâmetros e os
 * mesmos retornos. Este arquivo escolhe uma das duas e é o único lugar do
 * projeto que sabe que existe essa escolha: as telas importam daqui e não
 * fazem ideia de qual está ativa.
 *
 * Quem chega agora: leia daqui e vá para `modulo/<assunto>/servico.ts`.
 */
import { modoDemonstracao } from '@/compartilhado/fonte/supabase'

import { ServicoDeHabitos as HabitosNoBanco } from '@/modulo/habito/servico'
import { ServicoDeLivros as LivrosNoBanco } from '@/modulo/livro/servico'
import { ServicoDeFinancas as FinancasNoBanco } from '@/modulo/financa/servico'
import { ServicoDeMetas as MetasNoBanco } from '@/modulo/meta/servico'
import { ServicoDeHumor as HumorNoBanco } from '@/modulo/humor/servico'
import { ServicoDeInsights as InsightsNoBanco } from '@/modulo/painel/servico'

import {
  HabitosDaDemonstracao,
  LivrosDaDemonstracao,
  FinancasDaDemonstracao,
  MetasDaDemonstracao,
  HumorDaDemonstracao,
  InsightsDaDemonstracao
} from '@/compartilhado/fonte/servicosDeDemonstracao'

/**
 * Devolve a implementação que vale agora, mantendo o tipo da versão do banco —
 * é ela que as telas enxergam.
 *
 * O `as` aqui é necessário e fica só neste ponto: para o TypeScript, duas
 * classes diferentes nunca são o mesmo tipo, mesmo tendo métodos idênticos.
 * O que garante que os métodos batem é o teste de sempre — trocar o modo e o
 * app continuar funcionando — e o fato de a versão de demonstração copiar as
 * assinaturas da versão do banco.
 */
function escolher<NoBanco>(noBanco: NoBanco, naDemonstracao: unknown): NoBanco {
  return modoDemonstracao ? (naDemonstracao as NoBanco) : noBanco
}

export const ServicoDeHabitos = escolher(HabitosNoBanco, HabitosDaDemonstracao)
export const ServicoDeLivros = escolher(LivrosNoBanco, LivrosDaDemonstracao)
export const ServicoDeFinancas = escolher(FinancasNoBanco, FinancasDaDemonstracao)
export const ServicoDeMetas = escolher(MetasNoBanco, MetasDaDemonstracao)
export const ServicoDeHumor = escolher(HumorNoBanco, HumorDaDemonstracao)
export const ServicoDeInsights = escolher(InsightsNoBanco, InsightsDaDemonstracao)

export { modoDemonstracao }
