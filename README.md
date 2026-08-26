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
estado inicial).

O site é publicado pelo **GitHub Actions**, pelo workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), a cada push na `main` — a fonte do
Pages é o Actions (`build_type=workflow`), não um branch. Não há passo manual: o workflow constrói
com `BASE_PATH=/aurora/`, copia `dist/index.html` para `dist/404.html` (é o que faz as rotas do
React Router funcionarem no Pages) e envia o `dist/` com `actions/deploy-pages@v4`.

Para reproduzir o build da prévia na sua máquina:

```bash
BASE_PATH=/aurora/ npm run build   # no PowerShell: $env:BASE_PATH='/aurora/'; npm run build
```

> **Ao mexer em `.github/workflows/`, empurre por SSH.** Nenhum token do `gh` tem o escopo
> `workflow`, e o GitHub rejeita o push por HTTPS de qualquer arquivo nessa pasta. O `origin` deste
> clone já usa o alias SSH. A alternativa seria `gh auth refresh -h github.com -s workflow`, que é
> interativo.

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
   Isso cria as tabelas (`habits`, `habit_logs`, `books`, `finances`, `goals`, `mood_logs`,
   `insights`),
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
npm test        # 64 testes: regras, servicos e o contrato entre as duas fontes (vitest)
npm run lint    # oxlint
npm run preview # serve o build
```

---

## Estrutura

O código é separado **por assunto**, não por tipo técnico: tudo de hábitos mora em
`modulo/habito/`, tudo de humor em `modulo/humor/`, e assim por diante.

```
src/
  app/                 main → App → rotas
  estilo/              index.css (Tailwind)
  compartilhado/       o que serve a todos os módulos
    componente/        Botao, Cartao, Campo, Modal, Carregando, EstadoVazio,
                       CartaoIndicador, RotaProtegida
    moldura/           Moldura, Cabecalho, MenuLateral, AvisoDeDemonstracao
    gancho/            useAutenticacao, useTema
    utilitario/        formato.ts (moeda, datas, percentuais)
    tipo/              banco.ts (as tabelas do Supabase em TypeScript)
    fonte/             supabase.ts, fonteDeDados.ts (escolhe banco ou demonstração),
                       armazenamentoDeDemonstracao.ts (dados de exemplo da prévia)
  modulo/
    habito/            Pagina, servico, demonstracao, componente/
    livro/             idem (inclui a busca no Google Books)
    financa/           idem
    meta/              idem + regraDeProgresso.ts (com teste)
    humor/             idem + regraDeComparacao.ts (com teste)
    painel/            a tela inicial, que cruza os outros módulos
    conta/             entrar, cadastrar, configurações
supabase/
  schema.sql           Schema completo + RLS
docs/
  ARQUITETURA.md       o caminho de um clique até o banco, e as convenções
```

Cada módulo tem sempre `Pagina.tsx`, `servico.ts` e `demonstracao.ts` com esses
nomes exatos. Os imports são absolutos: `@/` aponta para `src/`.

> **Primeira vez no projeto?** Comece por [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).
> Ele mostra o caminho completo de um clique na tela até o banco e de volta, com um
> exemplo real, e explica o que fica em português e o que fica em inglês — e por quê.

## Funcionalidades

- **Autenticação** por email/senha (Supabase Auth), rotas protegidas e redirecionamento.
- **Hábitos**: CRUD, marcação diária com atualização otimista, cálculo de sequência atual e recorde,
  ícone/cor/frequência/meta.
- **Livros**: busca na API do Google Books, cadastro manual, progresso de páginas, finalizar com nota,
  filtros por status e estatísticas de leitura.
- **Finanças**: receitas e despesas por categoria, saldo total e mensal, seleção de mês,
  gráfico de pizza por categoria e cotação USD→BRL (AwesomeAPI).
- **Metas**: CRUD por categoria (leitura, hábitos, finanças, saúde), alvo com unidade, prazo,
  progresso calculado a partir do valor atual e filtro por status. Bater o alvo conclui a meta e
  cair abaixo dele a reabre; prazo vencido marca a meta como atrasada sem declarar fracasso.
  Meta sem alvo fica qualitativa: sem barra de progresso e com o status que você escolher.
  A meta também pode buscar o próprio número em outro módulo, em vez de esperar que você
  atualize à mão. São seis origens:

  | Origem | De onde vem o número |
  | --- | --- |
  | Eu atualizo na mão | o valor que você digitar (padrão) |
  | Livros finalizados | quantos livros você finalizou no período da meta |
  | Páginas lidas | as páginas desses livros finalizados |
  | Marcações de um hábito | em quantos dias você marcou o hábito escolhido |
  | Quanto guardei | entradas menos saídas no período |
  | Quanto gastei | só as saídas do período |

  O período é do início da meta (ou da criação dela) até o prazo (ou hoje) — é o que faz
  "ler 24 livros no ano" contar este ano e não a estante inteira, e o que impede uma meta de
  poupança criada hoje de já nascer batida por causa do dinheiro que você tinha antes.
  O valor é recalculado toda vez que a tela abre e nunca fica gravado, então corrigir o livro
  ou a transação corrige a meta sozinho. Livro finalizado sem data de conclusão não entra na
  conta, e a tela avisa quantos ficaram de fora.
- **Humor**: registro diário de humor e energia (escalas de 1 a 5) com nota opcional, um por dia.
  A tela mostra as médias de 30 dias, o gráfico de tendência, o histórico editável e a comparação
  entre cada hábito diário e o humor: o humor médio dos dias em que você cumpriu o hábito contra o
  dos dias em que não cumpriu. A comparação só aparece com pelo menos 5 dias registrados e 2 dias
  de cada lado; hábitos semanais e mensais ficam de fora, porque neles "não cumpriu" é o estado
  normal da maioria dos dias. É comparação, não causa — e o texto da tela nunca afirma o contrário.
- **Dashboard**: indicadores do dia, gráfico dos últimos 7 dias de hábitos, leitura em andamento,
  marcação do humor do dia e geração de insight diário (salvo na tabela `insights`).
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
| `getHabitCorrelations` com `productivity` | a dimensão virou `energy` | produtividade não tinha dado nenhum por trás; energia o usuário informa junto com o humor |

> As linhas da tabela acima citam os nomes originais do PDF. O codigo hoje usa nomes
> em portugues: `useAuth` virou `useAutenticacao`, `Database` virou `Banco`,
> `getHabitCorrelations` virou `obterComparacaoDosHabitos`. A conversao completa esta
> em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

O PDF define a tabela `goals` e o tipo `Goal`, mas nenhum serviço ou tela — a tela de Metas foi
desenhada aqui, seguindo o formato dos outros módulos. As regras de progresso e status ficam em
`src/modulo/meta/regraDeProgresso.ts`, fora do serviço, porque valem igual para o Supabase e para o modo
demonstração; são a única parte com teste automatizado.

A tabela `mood_logs` e a tela de Humor também não estão no PDF. Elas existem porque o
`getHabitCorrelations` da especificação devolvia valores simulados e nenhuma tela o chamava:
correlacionar hábito com humor exige registrar humor. Hoje a função calcula sobre dado real, e a
regra do cálculo ficou em `src/modulo/humor/regraDeComparacao.ts` — fora do serviço, testada, pelo mesmo
critério do `regraDeProgresso.ts`.

> **Já rodou o `schema.sql` antes?** Rode de novo. O arquivo é idempotente (`create table if not
> exists`, `drop policy if exists`, `add column if not exists`), então executá-lo inteiro só
> acrescenta a tabela `mood_logs`, o índice, o trigger, as políticas e as colunas `source` e
> `source_habit_id` da tabela `goals` — sem tocar nos seus dados. As metas que você já tem
> continuam manuais, porque `source` nasce com `default 'manual'`.
