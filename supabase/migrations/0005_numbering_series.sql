-- MinimalBooks
-- supabase/migrations/0005_numbering_series.sql
--
-- Ports Mbooks' numbering_series table 1:1, scoped by company_id. Selected
-- directly by the client only to preview an upcoming voucher number on a
-- blank/unsaved form (see numbering.peek_next_voucher_number in Mbooks);
-- the actual allocation (insert-if-missing + increment) only ever happens
-- inside the post_voucher RPC (0010_post_voucher_rpc.sql), which `select
-- ... for update`s the matching row -- the Postgres-native replacement for
-- SQLite's `BEGIN IMMEDIATE` lock Mbooks used locally.

create table public.numbering_series (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  book_key        text not null,
  financial_year  text not null,
  next_seq        integer not null default 1,
  format_pattern  text not null default '{fy}/{seq:03d}',
  unique (company_id, book_key, financial_year)
);

alter table public.numbering_series enable row level security;

create policy "select own numbering series" on public.numbering_series
  for select
  using (public.owns_company(company_id));

-- Insert/update are granted to `authenticated` (below) because the
-- post_voucher RPC runs security invoker, not security definer -- it
-- writes as the calling user, so the user's own role needs these grants.
-- RLS still confines writes to the caller's own company either way.
create policy "insert own numbering series" on public.numbering_series
  for insert
  with check (public.owns_company(company_id));

create policy "update own numbering series" on public.numbering_series
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

grant select, insert, update on public.numbering_series to authenticated;
