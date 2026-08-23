# Aurora — Dashboard Pessoal

Dashboard pessoal para acompanhar **hábitos**, **leitura** e **finanças**, construído a partir da
especificação do PDF `especificacao.pdf`.

Stack: React 19 + Vite + TypeScript + Tailwind CSS + Supabase (auth e banco) + Framer Motion +
Recharts + React Hook Form + Zod.

## Prévia online

**<https://guxtastak.github.io/aurora/>**

A prévia roda em **modo demonstração**: como o GitHub Pages não tem as credenciais do Supabase, o
app usa dados de exemplo salvos no `localStorage` do visitante. Qualquer email e senha entram, e
tudo que você criar/editar fica só no seu navegador (o botão *Restaurar dados* no topo devolve o
estado inicial). O deploy é feito pelo workflow [`deploy.yml`](.github/workflows/deploy.yml) a cada
push na `main`.

Com o `.env` preenchido, o mesmo código usa o Supabase de verdade — o modo demonstração só liga
quando não há credenciais válidas.

---

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Crie um projeto em <https://supabase.com>.
2. Abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e execute.
   Isso cria as tabelas (`habits`, `habit_logs`, `books`, `finances`, `goals`, `insights`),
   os índices, o trigger de `updated_at` e as políticas de RLS.
3. Em **Authentication > Providers > Email**, se quiser entrar sem confirmar email,
   desative *Confirm email*.

### 3. Preencher o `.env`

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_GOOGLE_BOOKS_API_KEY=opcional
```

A URL e a anon key ficam em **Project Settings > API**.
A chave do Google Books é **opcional** — sem ela a busca funciona com a quota anônima da API.

### 4. Subir o app

```bash
npm run dev     # http://localhost:5173
npm run build   # typecheck + build de produção
npm run preview # serve o build
```

---

## Estrutura

```
src/
  components/
    common/      Button, Card, Input/Select/Textarea, Modal, Loading, EmptyState, StatCard, ProtectedRoute
    layout/      Layout, Sidebar, Header
    habits/      HabitCard, HabitForm
    books/       BookCard, BookForm, BookSearch (Google Books)
    finances/    TransactionForm, TransactionList, CategoryChart
  pages/         Login, Register, Dashboard, Habits, Books, Finances, Settings
  hooks/         useAuth (AuthProvider + contexto), useTheme (dark mode)
  services/      supabase, habitService, bookService, financeService, insightService
                 data.ts (escolhe Supabase ou demo), demo/ (dados de exemplo da prévia)
  types/         database.types.ts
  utils/         format.ts (moeda, datas, percentuais)
  styles/        index.css (Tailwind)
supabase/
  schema.sql     Schema completo + RLS
```

## Funcionalidades

- **Autenticação** por email/senha (Supabase Auth), rotas protegidas e redirecionamento.
- **Hábitos**: CRUD, marcação diária com atualização otimista, cálculo de sequência atual e recorde,
  ícone/cor/frequência/meta.
- **Livros**: busca na API do Google Books, cadastro manual, progresso de páginas, finalizar com nota,
  filtros por status e estatísticas de leitura.
- **Finanças**: receitas e despesas por categoria, saldo total e mensal, seleção de mês,
  gráfico de pizza por categoria e cotação USD→BRL (AwesomeAPI).
- **Dashboard**: indicadores do dia, gráfico dos últimos 7 dias de hábitos, leitura em andamento e
  geração de insight diário (salvo na tabela `insights`).
- **Configurações**: conta, alternância de tema claro/escuro e histórico de insights.

## Decisões e desvios em relação ao PDF

O PDF termina no meio do PROMPT 3 (na primeira linha de `Button.tsx`). Os PROMPTs 1 e 2 foram
seguidos como escritos; o restante foi completado no mesmo estilo. Ajustes pontuais feitos por
necessidade técnica:

| Ponto do PDF | O que mudou | Motivo |
| --- | --- | --- |
| `useAuth.ts` | virou `useAuth.tsx` | o arquivo contém JSX (`AuthContext.Provider`) |
| `Database` com `interface` | virou `type` + `Relationships`, `Views`, `Functions` | o supabase-js v2 exige essas chaves e não aceita `interface` como `Record<string, unknown>`; sem isso todas as queries tipam como `never` |
| `Insert` incluía `user_id` | `user_id` é opcional | as tabelas usam `DEFAULT auth.uid()`, então o front não envia o campo |
| `Insight.type` | ganhou `'daily'` | `generateDailyInsights` grava exatamente esse valor |
| `updateStreak` (melhor sequência) | recalculado corretamente | o laço original nunca reiniciava a data de referência, então o recorde ficava igual à sequência atual |
| URLs de Google Books / AwesomeAPI / resumo mensal | template strings reconstruídas | os `${...}` foram corrompidos na exportação do PDF |
| `VITE_GOOGLE_BOOKS_API_KEY` | passou a ser opcional | a API responde sem chave; antes o app lançava erro |
| Fuso horário nas datas | uso de data local em vez de `toISOString()` direto | evita marcar o hábito no dia errado à noite (UTC-3) |

Itens citados na especificação e ainda não implementados: a tabela `goals` existe no schema e no
tipo `Goal`, mas não tem tela; `getHabitCorrelations` continua retornando os valores simulados do PDF.
