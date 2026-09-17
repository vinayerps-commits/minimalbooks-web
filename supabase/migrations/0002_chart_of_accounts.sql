-- MinimalBooks
-- supabase/migrations/0002_chart_of_accounts.sql
--
-- Ports Mbooks' chart_of_accounts table (C:\Users\padek\Mbooks\app\core\schema.sql)
-- 1:1, scoped by company_id. Seeded per-company at company-creation time by
-- the app (io/chartOfAccounts.ts), not by this migration -- matches Mbooks'
-- own app-level seed.py rather than a schema-level insert, since seeding
-- happens once per new company, not once per database.

create table public.chart_of_accounts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  code        text not null,
  name        text not null,
  type        text not null check (type in ('asset', 'liability', 'income', 'expense', 'equity')),
  is_group    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, code)
);

alter table public.chart_of_accounts enable row level security;

create policy "select own accounts" on public.chart_of_accounts
  for select
  using (public.owns_company(company_id));

create policy "insert own accounts" on public.chart_of_accounts
  for insert
  with check (public.owns_company(company_id));

create policy "update own accounts" on public.chart_of_accounts
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

create policy "delete own accounts" on public.chart_of_accounts
  for delete
  using (public.owns_company(company_id));

grant select, insert, update, delete on public.chart_of_accounts to authenticated;

create trigger chart_of_accounts_set_updated_at
before update on public.chart_of_accounts
for each row
execute function public.set_updated_at();
