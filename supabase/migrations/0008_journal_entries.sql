-- MinimalBooks
-- supabase/migrations/0008_journal_entries.sql
--
-- Ports Mbooks' journal_entries table 1:1 -- the actual double-entry
-- ledger. company_id is denormalized from voucher_id (not just derivable
-- via a join) so every ledger-report query's RLS check is a flat
-- `company_id = ...`-shaped comparison rather than a join through
-- vouchers, which matters once these reports run over a full year of
-- entries. Only ever written by the post_sales_invoice RPC
-- (0010_post_voucher_rpc.sql), never directly by the client.

create table public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  voucher_id      uuid not null references public.vouchers (id) on delete cascade,
  account_id      uuid not null references public.chart_of_accounts (id),
  debit           numeric not null default 0,
  credit          numeric not null default 0,
  entry_date      date not null,
  narration       text not null default ''
);

create index journal_entries_company_account_date_idx on public.journal_entries (company_id, account_id, entry_date);
create index journal_entries_voucher_idx on public.journal_entries (voucher_id);

alter table public.journal_entries enable row level security;

create policy "select own journal entries" on public.journal_entries
  for select
  using (public.owns_company(company_id));

-- Insert-only from the client's perspective (always via the RPC, which
-- runs security invoker) -- no update/delete policy: amending a posted
-- voucher must insert reversing entries, never mutate or delete existing
-- ones. That reversal-based amendment flow isn't built yet (Phase 1 has no
-- edit screen), but the schema already refuses to allow the shortcut.
create policy "insert own journal entries" on public.journal_entries
  for insert
  with check (public.owns_company(company_id));

grant select, insert on public.journal_entries to authenticated;
