-- =====================================================================
-- Aurora — schema do Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
--
-- Observacoes:
--  * user_id tem DEFAULT auth.uid(), por isso o front nao precisa envia-lo
--    nos INSERTs (é assim que os services do projeto funcionam).
--  * RLS ativo em todas as tabelas: cada usuario ve apenas os proprios dados.
-- =====================================================================

-- ------------------------------------------------------------------ habits
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name           text not null,
  description    text,
  icon           text,
  color          text,
  frequency      text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  target_count   integer not null default 1,
  current_streak integer not null default 0,
  best_streak    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -------------------------------------------------------------- habit_logs
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date       date not null,
  completed  boolean not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- ------------------------------------------------------------------- books
create table if not exists public.books (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title           text not null,
  author          text not null,
  cover_url       text,
  status          text not null default 'want_to_read'
                    check (status in ('reading', 'finished', 'want_to_read', 'dropped')),
  rating          integer check (rating between 1 and 5),
  notes           text,
  pages_total     integer default 0,
  pages_read      integer default 0,
  started_date    date,
  finished_date   date,
  google_books_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- finances
create table if not exists public.finances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date        date not null default current_date,
  type        text not null check (type in ('income', 'expense')),
  category    text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  description text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- goals
create table if not exists public.goals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title               text not null,
  description         text,
  target_value        numeric(12, 2),
  current_value       numeric(12, 2) default 0,
  unit                text,
  start_date          date,
  deadline            date,
  category            text not null check (category in ('reading', 'habits', 'finance', 'health')),
  status              text not null default 'active' check (status in ('active', 'completed', 'failed')),
  progress_percentage numeric(5, 2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------- insights
create table if not exists public.insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title        text not null,
  description  text not null,
  type         text not null check (type in ('correlation', 'prediction', 'achievement', 'daily')),
  metadata     jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ indices
create index if not exists habits_user_idx      on public.habits (user_id, created_at desc);
create index if not exists habit_logs_user_idx  on public.habit_logs (user_id, date desc);
create index if not exists habit_logs_habit_idx on public.habit_logs (habit_id, date desc);
create index if not exists books_user_idx       on public.books (user_id, created_at desc);
create index if not exists finances_user_idx    on public.finances (user_id, date desc);
create index if not exists goals_user_idx       on public.goals (user_id, created_at desc);
create index if not exists insights_user_idx    on public.insights (user_id, generated_at desc);

-- ------------------------------------------------- trigger de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------- RLS
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;
alter table public.books      enable row level security;
alter table public.finances   enable row level security;
alter table public.goals      enable row level security;
alter table public.insights   enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array['habits', 'habit_logs', 'books', 'finances', 'goals', 'insights'])
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I', t);

    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete using (auth.uid() = user_id)', t);
  end loop;
end;
$$;
