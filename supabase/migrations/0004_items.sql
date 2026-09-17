-- MinimalBooks
-- supabase/migrations/0004_items.sql
--
-- Ports Mbooks' items table 1:1, scoped by company_id.

create table public.items (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  code            text not null,
  name            text not null,
  hsn_sac         text not null default '',
  unit            text not null default 'Nos',
  sale_rate       numeric not null default 0,
  purchase_rate   numeric not null default 0,
  tax_percent     numeric not null default 0,
  item_type       text not null default 'goods' check (item_type in ('raw_material', 'goods', 'service')),
  opening_stock   numeric not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_id, code)
);

create index items_company_name_idx on public.items (company_id, name);

alter table public.items enable row level security;

create policy "select own items" on public.items
  for select
  using (public.owns_company(company_id));

create policy "insert own items" on public.items
  for insert
  with check (public.owns_company(company_id));

create policy "update own items" on public.items
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

create policy "delete own items" on public.items
  for delete
  using (public.owns_company(company_id));

grant select, insert, update, delete on public.items to authenticated;

create trigger items_set_updated_at
before update on public.items
for each row
execute function public.set_updated_at();
