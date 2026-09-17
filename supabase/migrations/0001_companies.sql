-- MinimalBooks
-- supabase/migrations/0001_companies.sql
--
-- One row per user's business ("company" in Tally terminology). MVP is
-- single-company-per-account (companies_one_per_owner below); every other
-- table in this schema is scoped by company_id rather than owner_id
-- directly, so dropping just that unique index later is the entire
-- multi-company upgrade -- no other table's RLS policy needs to change.

create extension if not exists pgcrypto;

create table public.companies (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null,
  address_line1   text not null default '',
  address_line2   text not null default '',
  city            text not null default '',
  state           text not null default '',
  state_code      text not null default '',
  pincode         text not null default '',
  gstin           text not null default '',
  msme            text not null default '',
  email           text not null default '',
  phone           text not null default '',
  bank_name       text not null default '',
  bank_account    text not null default '',
  bank_ifsc       text not null default '',
  bank_branch     text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- MVP: exactly one company per user. This is the only place "single
-- company" is enforced -- every other table just follows company_id.
create unique index companies_one_per_owner on public.companies (owner_id);

alter table public.companies enable row level security;

create policy "select own company" on public.companies
  for select
  using (owner_id = auth.uid());

create policy "insert own company" on public.companies
  for insert
  with check (owner_id = auth.uid());

create policy "update own company" on public.companies
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "delete own company" on public.companies
  for delete
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.companies to authenticated;

-- Reused by every later table with an updated_at column (chart_of_accounts,
-- parties, items, vouchers, ...) via `execute function public.set_updated_at()`.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

-- Reused by every company-scoped table's RLS policies below (`using
-- (public.owns_company(company_id))`). Centralizing the ownership check
-- here means the multi-company upgrade later (a user owning/belonging to
-- more than one company) is a one-function edit, not a per-table rewrite.
-- `stable` (not `immutable`) since it depends on table contents; security
-- invoker (the default) so it still runs as the calling user, respecting
-- companies' own RLS rather than bypassing it.
create or replace function public.owns_company(target_company_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.companies
    where id = target_company_id and owner_id = auth.uid()
  );
$$;
