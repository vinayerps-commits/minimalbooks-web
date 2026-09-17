-- MinimalBooks
-- supabase/migrations/0003_parties.sql
--
-- Ports Mbooks' parties table 1:1, scoped by company_id, plus one addition:
-- gst_registration_type. Needed for GSTR-1's B2B (registered, has GSTIN)
-- vs B2C (unregistered, bucketed by place-of-supply state) split -- an
-- explicit classification is more reliable than inferring it from "GSTIN
-- is blank", which a registered party could have simply not entered yet.

create table public.parties (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,
  name                text not null,
  party_type          text not null default 'customer' check (party_type in ('customer', 'vendor', 'both')),
  billing_address     text not null default '',
  shipping_address    text not null default '',
  state               text not null default '',
  state_code          text not null default '',
  gstin               text not null default '',
  gst_registration_type text not null default 'unregistered'
    check (gst_registration_type in ('registered', 'unregistered', 'composition', 'overseas', 'consumer')),
  phone               text not null default '',
  email               text not null default '',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index parties_company_name_idx on public.parties (company_id, name);

alter table public.parties enable row level security;

create policy "select own parties" on public.parties
  for select
  using (public.owns_company(company_id));

create policy "insert own parties" on public.parties
  for insert
  with check (public.owns_company(company_id));

create policy "update own parties" on public.parties
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

create policy "delete own parties" on public.parties
  for delete
  using (public.owns_company(company_id));

grant select, insert, update, delete on public.parties to authenticated;

create trigger parties_set_updated_at
before update on public.parties
for each row
execute function public.set_updated_at();
