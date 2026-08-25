/**
 * O contrato entre as duas implementações de cada serviço.
 *
 * O `fonteDeDados` troca a versão do Supabase pela versão de demonstração em
 * tempo de execução, e o TypeScript não consegue provar que as duas batem —
 * duas classes diferentes nunca são o mesmo tipo para ele, mesmo com métodos
 * idênticos.
 *
 * Este teste faz essa prova: se alguém acrescentar um método no serviço e
 * esquecer da demonstração, a prévia hospedada quebraria com "não é uma
 * função" no clique do usuário. Aqui ela quebra no CI, antes.
 */
import { describe, it, expect } from 'vitest'

import { ServicoDeHabitos } from '@/modulo/habito/servico'
import { HabitosDaDemonstracao } from '@/modulo/habito/demonstracao'
import { ServicoDeLivros } from '@/modulo/livro/servico'
import { LivrosDaDemonstracao } from '@/modulo/livro/demonstracao'
import { ServicoDeFinancas } from '@/modulo/financa/servico'
import { FinancasDaDemonstracao } from '@/modulo/financa/demonstracao'
import { ServicoDeMetas } from '@/modulo/meta/servico'
import { MetasDaDemonstracao } from '@/modulo/meta/demonstracao'
import { ServicoDeHumor } from '@/modulo/humor/servico'
import { HumorDaDemonstracao } from '@/modulo/humor/demonstracao'
import { ServicoDeInsights } from '@/modulo/painel/servico'
import { InsightsDaDemonstracao } from '@/modulo/painel/demonstracao'

/** Nomes dos métodos estáticos, fora o que toda classe tem de brinde */
function metodos(classe: object) {
  return Object.getOwnPropertyNames(classe)
    .filter(nome => !['length', 'name', 'prototype'].includes(nome))
    .filter(nome => typeof (classe as Record<string, unknown>)[nome] === 'function')
    .sort()
}

const pares = [
  { assunto: 'hábitos', noBanco: ServicoDeHabitos, naDemonstracao: HabitosDaDemonstracao },
  { assunto: 'livros', noBanco: ServicoDeLivros, naDemonstracao: LivrosDaDemonstracao },
  { assunto: 'finanças', noBanco: ServicoDeFinancas, naDemonstracao: FinancasDaDemonstracao },
  { assunto: 'metas', noBanco: ServicoDeMetas, naDemonstracao: MetasDaDemonstracao },
  { assunto: 'humor', noBanco: ServicoDeHumor, naDemonstracao: HumorDaDemonstracao },
  { assunto: 'insights', noBanco: ServicoDeInsights, naDemonstracao: InsightsDaDemonstracao }
]

describe('contrato entre o servico do banco e o da demonstracao', () => {
  for (const { assunto, noBanco, naDemonstracao } of pares) {
    it(`${assunto}: a demonstracao tem os mesmos metodos do servico`, () => {
      expect(metodos(naDemonstracao)).toEqual(metodos(noBanco))
    })

    it(`${assunto}: os metodos recebem a mesma quantidade de parametros`, () => {
      const doBanco = noBanco as unknown as Record<string, (...args: unknown[]) => unknown>
      const daDemonstracao = naDemonstracao as unknown as Record<string, (...args: unknown[]) => unknown>

      for (const nome of metodos(noBanco)) {
        // `length` de uma funcao conta os parametros sem valor padrao
        expect(
          daDemonstracao[nome].length,
          `${nome} recebe ${doBanco[nome].length} parametro(s) no servico`
        ).toBe(doBanco[nome].length)
      }
    })
  }
})
