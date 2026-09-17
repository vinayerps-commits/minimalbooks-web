-- MinimalBooks
-- supabase/migrations/0007_voucher_lines.sql
--
-- Ports Mbooks' voucher_lines table 1:1, scoped by company_id (denormalized
-- from voucher_id, same reasoning as journal_entries/stock_ledger below:
-- a flat company_id keeps RLS a direct comparison rather than a join).

create table public.voucher_lines (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  voucher_id      uuid not null references public.vouchers (id) on delete cascade,
  line_no         integer not null,
  item_id         uuid references public.items (id),
  description     text not null default '',
  hsn_sac         text not null default '',
  qty             numeric not null default 0,
  unit            text not null default '',
  rate            numeric not null default 0,
  tax_percent     numeric not null default 0,
  cgst_amt        numeric not null default 0,
  sgst_amt        numeric not null default 0,
  igst_amt        numeric not null default 0,
  line_total      numeric not null default 0
);

create index voucher_lines_voucher_idx on public.voucher_lines (voucher_id, line_no);

alter table public.voucher_lines enable row level security;

create policy "select own voucher lines" on public.voucher_lines
  for select
  using (public.owns_company(company_id));

create policy "insert own voucher lines" on public.voucher_lines
  for insert
  with check (public.owns_company(company_id));

create policy "update own voucher lines" on public.voucher_lines
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

create policy "delete own voucher lines" on public.voucher_lines
  for delete
  using (public.owns_company(company_id));

grant select, insert, update, delete on public.voucher_lines to authenticated;
