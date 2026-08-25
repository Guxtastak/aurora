# Metas que se alimentam dos outros módulos

Data: 25/08/2026 · Status: aprovado, pronto para virar plano de implementação

## Por que

Hoje os cinco módulos do Aurora são ilhas. A meta já sabe de qual assunto ela
fala — a coluna `goals.category` tem `reading`, `habits`, `finance` e `health` —
mas o `current_value` continua sendo digitado à mão. Uma meta "ler 24 livros no
ano" não olha para a estante; uma meta "guardar R$ 12.000" não olha para as
finanças. O README admite isso desde o começo: "progresso manual".

Este documento define como a meta passa a buscar o próprio número.

## Escopo

Dentro:

- Duas colunas novas em `goals`: a origem do número e, quando for o caso, o
  hábito de onde ele vem.
- Seis origens, sendo uma delas a manual de hoje.
- O cálculo do valor a partir dos dados dos outros módulos, respeitando a
  janela da meta.
- Formulário e cartão da meta refletindo a origem.

Fora:

- Notificar quando a meta é batida. A meta muda de status na tela; avisar é
  outro assunto (precisa de push ou email).
- Metas de humor e de saúde automáticas. `health` não tem módulo, e humor não
  tem uma métrica de "progresso" que faça sentido como alvo.
- Histórico do progresso ao longo do tempo (gráfico da meta). Exigiria gravar
  medições periódicas, o que este desenho deliberadamente não faz.

## Modelo de dado

```sql
alter table public.goals
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'books_finished', 'pages_read',
                      'habit_checkins', 'money_saved', 'money_spent')),
  add column if not exists source_habit_id uuid
    references public.habits (id) on delete set null;
```

Decisões embutidas aí:

- **`default 'manual'`** — as metas que já existem continuam funcionando
  exatamente como hoje, sem migração de dados.
- **`on delete set null`** — apagar o hábito não apaga a meta. Ela volta a ficar
  sem fonte, e a tela avisa em vez de sumir com o número.
- **Nomes de coluna em inglês**, como todas as outras: eles existem assim no
  Postgres.

Em `compartilhado/tipo/banco.ts`, `Meta`, `MetaParaInserir` e `MetaParaAtualizar`
ganham `source` e `source_habit_id`.

## As seis origens

| `source` | O que conta | Unidade sugerida |
| --- | --- | --- |
| `manual` | nada: você digita o valor | — |
| `books_finished` | livros com `finished_date` dentro da janela | livros |
| `pages_read` | soma de `pages_total` dos livros finalizados na janela | páginas |
| `habit_checkins` | marcações do hábito escolhido, `completed = true`, na janela | dias |
| `money_saved` | entradas menos saídas, na janela | R$ |
| `money_spent` | saídas, na janela | R$ |

`habit_checkins` é a única que exige `source_habit_id`. As outras ignoram o campo.

**Por que `money_saved` não é o saldo.** O saldo é uma foto do agora: ele não
respeita janela nenhuma, e uma meta criada hoje já nasceria batida por causa do
dinheiro que você já tinha. Entradas menos saídas dentro da janela é acúmulo de
verdade e responde à pergunta que a meta faz — "quanto eu guardei desde que
decidi guardar".

## A janela

Todas as origens automáticas contam apenas o que aconteceu entre duas datas:

- **Início:** `start_date`. Se estiver vazio, a data de `created_at` da meta.
- **Fim:** `deadline`. Se estiver vazio, hoje.

O dia do início e o dia do prazo contam (intervalo fechado).

## Onde o número mora

**Recalculado ao abrir a tela, nunca gravado.**

Se o valor fosse gravado em `current_value`, toda tela que mexe em livro, hábito
ou transação teria que lembrar de atualizar as metas afetadas. No dia em que
alguém esquecesse, a meta passaria a mentir em silêncio — o defeito mais caro de
achar. Recalcular sempre acerta, e o custo é uma busca a mais ao abrir a tela de
Metas.

Consequência a assumir: para meta automática, o `current_value` e o
`progress_percentage` gravados **deixam de ser autoridade**. A tela deriva os
dois na hora, aplicando a `regraDeProgresso` que já existe e já tem teste. Meta
manual continua lendo os valores do banco, como sempre.

## Arquitetura

Três peças novas no módulo de metas, seguindo a divisão que o projeto já usa:

**`modulo/meta/origens.ts`** — o catálogo. Para cada origem: o identificador, o
rótulo que aparece na tela, a unidade sugerida, se exige hábito e a categoria
que a sugere por padrão. É dado, não lógica.

**`modulo/meta/regraDeOrigem.ts`** — pura e testada, no mesmo espírito de
`regraDeProgresso` e `regraDeComparacao`. Assinatura:

```ts
type DadosDosModulos = {
  livros: Livro[]
  marcacoes: MarcacaoDeHabito[]
  transacoes: Transacao[]
}

/** Início e fim efetivos da meta, já resolvidos os campos vazios */
export function janelaDaMeta(meta: Meta): { inicio: string; fim: string }

/** Valor atual da meta. Para origem manual, devolve o current_value gravado. */
export function valorDaMeta(meta: Meta, dados: DadosDosModulos): number
```

**`modulo/meta/progressoAutomatico.ts`** — a costura. Busca livros, marcações e
transações uma única vez (via `fonteDeDados`, então funciona igual no modo
demonstração) e aplica a regra a todas as metas, devolvendo as metas já com o
valor, o progresso e o status vivos.

A tela de Metas passa a buscar por ele em vez de chamar `listarMetas` direto.

## Telas

**`FormularioDeMeta`** ganha o campo **Origem**, logo abaixo de Categoria. Ao
escolher a categoria, a origem sugerida pelo catálogo vem pré-selecionada — mas
dá para trocar, porque duas metas de finanças podem medir coisas diferentes.

- Origem automática: o campo **Atual** desaparece e no lugar entra a frase "o
  valor vem de: livros finalizados". A unidade também é pré-preenchida.
- Origem `habit_checkins`: aparece um seletor com os hábitos do usuário.

**`CartaoDeMeta`** ganha um selo discreto — "atualiza sozinha · livros
finalizados" — para você não procurar o campo de editar o valor e não achar.

Meta cujo hábito foi apagado (`source_habit_id` nulo com `source =
'habit_checkins'`) mostra "o hábito desta meta foi excluído" e progresso zero,
em vez de sumir com o número.

## Modo demonstração

`MetasDaDemonstracao` acompanha as colunas novas. O seed ganha ao menos uma meta
automática de cada tipo que a prévia consegue mostrar com dado real — leitura e
finanças —, para o recurso aparecer funcionando em vez de zerado.
`STORAGE_KEY` sobe para `aurora-demo-v4`, porque o formato das metas muda.

## Testes

`regraDeOrigem.test.ts`, escrito antes da implementação:

- janela com `start_date` e `deadline` preenchidos;
- janela sem `start_date` (cai no `created_at`);
- janela sem `deadline` (vai até hoje);
- livro finalizado antes do início não conta; dentro da janela conta;
- livro finalizado **sem `finished_date`** não conta (ver riscos);
- páginas somam só dos finalizados na janela;
- marcações contam só do hábito escolhido, e só as `completed = true`;
- `money_saved` é entrada menos saída na janela; pode dar negativo;
- `money_spent` soma só as saídas;
- origem manual devolve o `current_value` gravado, sem olhar para nada.

O teste de contrato entre banco e demonstração cobre os métodos novos
automaticamente.

## Riscos

- **Livro finalizado sem `finished_date`.** O campo é opcional no schema, então
  existem livros finalizados sem data. Eles não entram na contagem, e a tela
  precisa dizer isso quando o número parecer baixo — senão o usuário conclui que
  a conta está quebrada. Mitigação: o cartão da meta de leitura mostra quantos
  livros finalizados ficaram de fora por falta de data.
- **Uma busca a mais ao abrir Metas.** Passa a carregar livros, marcações e
  transações junto. É o preço de não gravar; em volume pessoal, é irrelevante.
- **Meta automática não pode ter o valor editado.** Quem quiser corrigir o
  número precisa corrigir o dado de origem — o que é o comportamento certo, mas
  precisa estar claro na tela.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `supabase/schema.sql` | duas colunas em `goals` |
| `compartilhado/tipo/banco.ts` | `source` e `source_habit_id` nos três tipos de meta |
| `modulo/meta/origens.ts` | novo |
| `modulo/meta/regraDeOrigem.ts` | novo |
| `modulo/meta/regraDeOrigem.test.ts` | novo |
| `modulo/meta/progressoAutomatico.ts` | novo |
| `modulo/meta/Pagina.tsx` | busca pelo progresso automático |
| `modulo/meta/componente/FormularioDeMeta.tsx` | campo Origem e seletor de hábito |
| `modulo/meta/componente/CartaoDeMeta.tsx` | selo da origem |
| `modulo/meta/demonstracao.ts` | colunas novas |
| `compartilhado/fonte/armazenamentoDeDemonstracao.ts` | seed com metas automáticas, `v4` |
| `README.md` e `docs/ARQUITETURA.md` | documentam o recurso |
