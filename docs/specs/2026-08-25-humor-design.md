# Módulo de humor e correlação com hábitos

Data: 25/08/2026 · Status: aprovado, pronto para virar plano de implementação

## Por que

O `insightService.getHabitCorrelations` existe desde o primeiro commit devolvendo
números fixos (`{ reading: { productivity: 0.75, mood: 0.60 }, ... }`) e **nenhuma
tela o chama** — é código morto que finge um recurso. O schema não tem humor, então
não havia como calcular nada de verdade.

Este documento define o módulo que fecha esse buraco: registrar humor e energia por
dia e, a partir disso, mostrar como cada hábito diário se relaciona com o humor.

## Escopo

Dentro:

- Tabela `mood_logs` com RLS, mais tipos, serviço e espelho no modo demonstração.
- Marcação diária de humor e energia no Dashboard.
- Página `/mood` (rota em ingles como as outras: /habits, /books, /finances, /goals) com médias, gráfico de tendência, correlações e histórico.
- `getHabitCorrelations` calculando sobre dado real.

Fora:

- Vários registros por dia. O modelo é um registro por dia; mudar isso depois
  significa trocar a chave única e o cálculo.
- Qualquer afirmação de causalidade. A tela descreve o que foi observado.
- Correlação com livros, finanças ou metas.
- Produtividade como dimensão: não existe dado por trás dela, e o campo sai do
  retorno da função em vez de continuar inventado.

## Modelo de dado

```sql
create table if not exists public.mood_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date       date not null default current_date,
  mood       integer not null check (mood between 1 and 5),
  energy     integer not null check (energy between 1 and 5),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists mood_logs_user_date_idx on public.mood_logs (user_id, date desc);
```

Mais, no `supabase/schema.sql`:

- trigger `mood_logs_set_updated_at` usando a função `set_updated_at` já existente;
- `alter table public.mood_logs enable row level security;`
- `mood_logs` acrescentado ao array de nomes do bloco `do` que gera as políticas —
  aquele laço é dirigido por nome de tabela, então as quatro políticas
  (select/insert/update/delete por `auth.uid() = user_id`) saem sem código novo.

`user_id` tem `default auth.uid()`, como nas outras tabelas: o front não envia o campo.

Em `src/types/database.types.ts`: tipo `MoodLog` e a entrada `mood_logs` com
`Row`/`Insert`/`Update` dentro de `Database['public']['Tables']`.

## Serviço

`src/services/moodService.ts`, classe `MoodService`:

| Método | Comportamento |
| --- | --- |
| `getMoodLogs(days = 30)` | Registros dos últimos N dias, mais recente primeiro |
| `getMoodByDate(date)` | Um registro ou nulo (`maybeSingle`) |
| `saveMood({ date, mood, energy, notes })` | Lê o dia; se existe, atualiza pelo id; se não, insere |
| `deleteMood(id)` | Remove o registro |

`saveMood` usa ler-depois-inserir-ou-atualizar, e **não** `upsert`. Motivo: o
`onConflict` teria de citar `(user_id, date)`, e `user_id` não vai no payload — vem do
default. O `HabitService.toggleHabitOnDate` já resolve o mesmo problema do mesmo jeito
sobre `unique(habit_id, date)`; seguir o padrão existente vale mais que economizar um
round-trip.

Registrar `MoodService` no `src/services/data.ts`, ao lado dos outros, escolhendo
entre Supabase e demo pelo `isDemo`.

## Regras da correlação

Ficam em `src/utils/moodCorrelation.ts` — puro, sem banco, testável. Mesmo lugar e
mesmo motivo do `goalProgress.ts`: as regras valem igual para o Supabase e para o modo
demonstração.

Entrada: lista de hábitos, lista de `habit_logs`, lista de `mood_logs`.
Saída, um item por hábito elegível:

```ts
{
  habitId: string
  habitName: string
  days: number              // dias com humor registrado dentro da janela do hábito
  comHabito: { mood: number; energy: number }
  semHabito: { mood: number; energy: number }
  deltaMood: number         // comHabito.mood - semHabito.mood
  deltaEnergy: number
  enough: boolean
}
```

Regras, todas com teste próprio:

1. **Amostra** — só entram dias com registro de humor. Dia sem registro não é dia
   ruim, é dia sem dado.
2. **Dia cumprido** — existe `habit_log` daquele hábito naquela data com
   `completed = true`. Log com `completed = false` conta como não cumprido.
3. **Janela** — só dias a partir da data de `created_at` do hábito. Antes disso,
   marcar como "não cumpriu" seria falso.
4. **Mínimo** — `enough` é verdadeiro com pelo menos 5 dias de humor na janela **e**
   pelo menos 2 dias em cada grupo. Abaixo disso a média de um único dia viraria
   "descoberta".
5. **Frequência** — só hábitos com `frequency = 'daily'`. Em semanal e mensal, "não
   cumpriu" é o estado normal da maioria dos dias e o número mentiria.
6. **Ordenacao** - habitos com amostra suficiente primeiro; dentro de cada grupo,
   por valor absoluto de `deltaMood`, decrescente. Sem os dois lados da amostra a
   diferenca compararia uma media com zero, entao ela nao ordena nada.
7. **Medias** - arredondadas a uma casa decimal na exibicao, nao no calculo.

Itens com `enough` falso são devolvidos assim mesmo, para a tela poder dizer quantos
dias ainda faltam em vez de esconder o hábito.

## getHabitCorrelations

Deixa de devolver números fixos: carrega hábitos, logs e humores e delega ao util. O
formato de retorno muda, e isso é livre porque nenhuma tela consome a função hoje.
`productivity` sai do retorno; `energy` entra. O espelho em `demoServices.ts` muda
junto, mantendo a mesma assinatura.

## Telas

**`MoodCheckin`** (`src/components/mood/MoodCheckin.tsx`), no topo do Dashboard:
duas fileiras de cinco botões (humor e energia, 1 a 5, com emoji e rótulo acessível),
campo de nota opcional recolhido por padrão. Se o dia já tem registro, vem preenchido
e editável. Salva pelo `MoodService.saveMood`.

**Página `/mood`** (`src/pages/Mood.tsx`), item novo no Sidebar entre Metas e
Configurações, ícone `Smile` do lucide-react:

- `StatCard`s: humor médio e energia média dos últimos 30 dias, e dias registrados.
- `MoodTrendChart`: linha dupla (humor e energia) dos últimos 30 dias, Recharts,
  seguindo o padrão do gráfico do Dashboard.
- `HabitMoodCorrelations`: por hábito, "nos dias em que você fez X, seu humor médio
  foi 4,2; nos outros, 3,1 (+1,1)". Item sem amostra suficiente mostra quantos dias
  faltam.
- `MoodHistory`: lista dos registros com nota, com editar e excluir.

Rota protegida em `routes.tsx`, como as demais.

Texto da tela nunca afirma causa: "nos dias em que você fez X, seu humor médio foi Y",
nunca "X melhora seu humor".

## Modo demonstração

`DemoMoodService` no `demoServices.ts` com as mesmas assinaturas, operando sobre o
`demoStore`. No seed, cerca de 35 dias de humor e energia correlacionados de propósito
com os hábitos já semeados, para a prévia mostrar o recurso com dado plausível.
`STORAGE_KEY` vai de `aurora-demo-v2` para `aurora-demo-v3` — visitante antigo tem os
dados de exemplo recriados, que é o comportamento aceito quando o formato muda.

## Testes

TDD no `moodCorrelation.ts`, com os testes escritos antes da implementação, cobrindo:
grupo vazio; amostra abaixo do mínimo; hábito criado no meio da janela; hábito não
diário ignorado; log com `completed = false`; delta positivo; delta negativo;
ordenação. É a única parte com teste automatizado, pelo mesmo critério do
`goalProgress.ts`: regra pura de negócio.

O CI (`.github/workflows/ci.yml`) roda build, lint e testes no PR.

## Riscos

- **Ruído com pouca amostra.** Poucas semanas de dado fazem qualquer diferença de
  médias oscilar muito. Mitigação: o mínimo da regra 4, o aviso de amostra
  insuficiente na tela e a linguagem descritiva.
- **Viés de registro.** Quem registra humor só em dia marcante distorce a média. Não
  há mitigação técnica; é limitação conhecida, e o histórico deixa a lacuna visível.
- **Correlação não é causa.** Tratado no texto da tela; nenhuma cópia pode sugerir
  intervenção.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `supabase/schema.sql` | tabela, índice, trigger, RLS |
| `src/types/database.types.ts` | `MoodLog` e `mood_logs` |
| `src/services/moodService.ts` | novo |
| `src/services/data.ts` | exporta `MoodService` |
| `src/services/demo/demoServices.ts` | `DemoMoodService`, correlação real |
| `src/services/demo/demoStore.ts` | seed de humor, `v3` |
| `src/services/insightService.ts` | `getHabitCorrelations` real |
| `src/utils/moodCorrelation.ts` | novo |
| `src/utils/moodCorrelation.test.ts` | novo |
| `src/components/mood/MoodCheckin.tsx` | novo |
| `src/components/mood/MoodTrendChart.tsx` | novo |
| `src/components/mood/MoodHistory.tsx` | novo |
| `src/components/mood/HabitMoodCorrelations.tsx` | novo |
| `src/pages/Mood.tsx` | novo |
| `src/pages/Dashboard.tsx` | inclui o `MoodCheckin` |
| `src/routes.tsx` | rota `/mood` |
| `src/components/layout/Sidebar.tsx` | item Humor |
| `README.md` | documenta o módulo e remove o item pendente |
