-- MinimalBooks
-- supabase/migrations/0009_stock_ledger.sql
--
-- Ports Mbooks' stock_ledger table 1:1. Only ever written by the
-- post_sales_invoice RPC (0010_post_voucher_rpc.sql) for goods/raw_material
-- lines -- service lines never touch this table.

create table public.stock_ledger (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  voucher_id      uuid not null references public.vouchers (id) on delete cascade,
  item_id         uuid not null references public.items (id),
  movement_date   date not null,
  qty_in          numeric not null default 0,
  qty_out         numeric not null default 0,
  rate            numeric not null default 0
);

create index stock_ledger_company_item_date_idx on public.stock_ledger (company_id, item_id, movement_date);

alter table public.stock_ledger enable row level security;

create policy "select own stock ledger" on public.stock_ledger
  for select
  using (public.owns_company(company_id));

create policy "insert own stock ledger" on public.stock_ledger
  for insert
  with check (public.owns_company(company_id));

grant select, insert on public.stock_ledger to authenticated;
