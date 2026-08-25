# Plano de implementação — metas automáticas

**Objetivo:** a meta passa a buscar o próprio número no módulo da origem escolhida,
em vez de depender do valor digitado à mão.

**Arquitetura:** duas colunas novas em `goals` (`source`, `source_habit_id`); o
cálculo em util puro e testado (`regraDeOrigem`); a costura com os outros módulos
em `progressoAutomatico`; o valor é recalculado ao abrir a tela e nunca gravado.

**Spec:** `docs/specs/2026-08-25-metas-automaticas-design.md`

## Restrições globais

- Colunas novas em inglês; `source` com `default 'manual'` para não migrar dado.
- Janela: `start_date` (ou `created_at`) até `deadline` (ou hoje), intervalo fechado.
- O valor de meta automática **nunca** é gravado — sempre recalculado.
- `money_saved` é entrada menos saída na janela, não o saldo.
- Datas sempre em fuso local, via `paraDataISO` / `dataDeHoje`.
- Toda peça nova começa com cabeçalho dizendo o que é e quem usa.
- Commits sem menção a ferramenta ou assistente.

---

### Task 1: Schema e tipos

**Arquivos:** `supabase/schema.sql`, `compartilhado/tipo/banco.ts`

- [ ] `alter table public.goals add column if not exists source ...` com o `check`
      das seis origens, e `source_habit_id uuid references public.habits (id) on
      delete set null`. Vai logo depois do `create table` de `goals`, para quem
      lê o arquivo de cima a baixo entender que é a mesma tabela.
- [ ] `Meta`, `MetaParaInserir` e `MetaParaAtualizar` ganham os dois campos.
- [ ] `npm run build`. Commit.

---

### Task 2: O catálogo de origens

**Arquivos:** criar `modulo/meta/origens.ts`

**Produz:**
```ts
export type Origem = 'manual' | 'books_finished' | 'pages_read'
                   | 'habit_checkins' | 'money_saved' | 'money_spent'

export type DescricaoDaOrigem = {
  id: Origem
  rotulo: string
  unidadeSugerida: string
  precisaDeHabito: boolean
  categoriaSugerida?: Meta['category']
}

export const ORIGENS: DescricaoDaOrigem[]
export function origemPorId(id: Origem): DescricaoDaOrigem
export function origemSugeridaPara(categoria: Meta['category']): Origem
```

- [ ] Escrever o catálogo com as seis entradas da spec.
- [ ] `npm run build`. Commit junto da Task 3.

---

### Task 3: A regra do valor (TDD)

**Arquivos:** criar `modulo/meta/regraDeOrigem.test.ts` e `modulo/meta/regraDeOrigem.ts`

**Produz:**
```ts
export type DadosDosModulos = {
  livros: Livro[]
  marcacoes: MarcacaoDeHabito[]
  transacoes: Transacao[]
}

export function janelaDaMeta(meta: Meta): { inicio: string; fim: string }
export function valorDaMeta(meta: Meta, dados: DadosDosModulos): number
export function livrosSemDataDeConclusao(dados: DadosDosModulos): number
```

- [ ] **Passo 1:** escrever os testes da spec — janela completa, sem início, sem
      prazo; livro fora e dentro da janela; livro finalizado sem `finished_date`;
      páginas só dos finalizados na janela; marcações só do hábito escolhido e só
      as `completed`; `money_saved` podendo dar negativo; `money_spent` só saídas;
      origem manual devolvendo o `current_value`.
- [ ] **Passo 2:** `npm test` — falha por módulo inexistente.
- [ ] **Passo 3:** implementar o mínimo que passa.
- [ ] **Passo 4:** `npm test` verde. Commit com a Task 2.

---

### Task 4: A costura com os outros módulos

**Arquivos:** criar `modulo/meta/progressoAutomatico.ts`

**Consome:** `regraDeOrigem`, `regraDeProgresso`, e os serviços via `fonteDeDados`.

**Produz:**
```ts
export type MetaComProgresso = Meta & {
  valorAtual: number
  progresso: number
  statusVivo: Meta['status']
  habitoAusente: boolean
}

export async function listarMetasComProgresso(): Promise<{
  metas: MetaComProgresso[]
  livrosSemData: number
}>
```

- [ ] Buscar metas, livros, marcações e transações com um `Promise.all`.
- [ ] Para cada meta: valor pela `regraDeOrigem`, progresso e status pela
      `regraDeProgresso` — sem gravar nada.
- [ ] `habitoAusente` verdadeiro quando `source === 'habit_checkins'` e
      `source_habit_id` é nulo.
- [ ] `npm run build`. Commit.

---

### Task 5: A tela de Metas

**Arquivos:** `modulo/meta/Pagina.tsx`

- [ ] Trocar `ServicoDeMetas.listarMetas()` por `listarMetasComProgresso()` no
      `useDados`, mantendo o mesmo formato de retorno para o resto da tela.
- [ ] Filtro por status e progresso médio passam a usar o `statusVivo` e o
      `progresso` calculados, não os do banco.
- [ ] Aviso no topo quando `livrosSemData > 0`.
- [ ] `npm run build`, `npm run lint`. Commit.

---

### Task 6: O formulário

**Arquivos:** `modulo/meta/componente/FormularioDeMeta.tsx`

- [ ] Campo **Origem** abaixo de Categoria, alimentado pelo `ORIGENS`.
- [ ] Trocar a categoria pré-seleciona a origem sugerida e a unidade.
- [ ] Origem automática esconde o campo **Atual** e mostra "o valor vem de: X".
- [ ] Origem `habit_checkins` mostra o seletor de hábitos (carregado do serviço).
- [ ] `npm run build`, `npm run lint`. Commit.

---

### Task 7: O cartão

**Arquivos:** `modulo/meta/componente/CartaoDeMeta.tsx`

- [ ] Selo "atualiza sozinha · <rótulo da origem>" para meta automática.
- [ ] Aviso "o hábito desta meta foi excluído" quando `habitoAusente`.
- [ ] `npm run build`, `npm run lint`. Commit.

---

### Task 8: Modo demonstração

**Arquivos:** `modulo/meta/demonstracao.ts`, `compartilhado/fonte/armazenamentoDeDemonstracao.ts`

- [ ] `demonstracao.ts` grava e devolve as colunas novas.
- [ ] Seed: a meta de leitura vira `books_finished` e a de finanças vira
      `money_saved`, para a prévia mostrar o recurso com dado real.
- [ ] `STORAGE_KEY` para `aurora-demo-v4`.
- [ ] `npm test` (o contrato cobre os métodos). Commit.

---

### Task 9: Documentação e PR

**Arquivos:** `README.md`, `docs/ARQUITETURA.md`

- [ ] README: descrever as origens em Funcionalidades e avisar que quem já rodou
      o `schema.sql` precisa rodar de novo (o `alter ... if not exists` é idempotente).
- [ ] ARQUITETURA: acrescentar `regraDeOrigem` na tabela de onde moram as decisões.
- [ ] Abrir PR, conferir o CI, testar as sete telas no navegador.

## Autorrevisão

- Cobertura da spec: schema (T1), origens (T2), regra e janela (T3), costura (T4),
  telas (T5–T7), demonstração (T8), documentação (T9). Sem lacuna.
- Consistência de nomes: `Origem`, `ORIGENS`, `janelaDaMeta`, `valorDaMeta`,
  `livrosSemDataDeConclusao`, `MetaComProgresso`, `listarMetasComProgresso`
  usados igual em T2, T3, T4, T5 e T7.
