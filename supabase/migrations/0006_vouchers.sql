-- MinimalBooks
-- supabase/migrations/0006_vouchers.sql
--
-- Ports Mbooks' vouchers table 1:1, scoped by company_id, plus two
-- additions: `book_key` gets a check constraint (Mbooks left it free-text)
-- enumerating the voucher types this phase supports -- extend the list as
-- later phases add books, rather than dropping the constraint entirely, so
-- a typo'd book_key still fails loudly. `is_registered_party` is frozen
-- onto the voucher at posting time from the party's gst_registration_type
-- (see 0003_parties.sql) so a later change to the party master can't
-- retroactively corrupt a historical GSTR-1 classification -- mirrors
-- Tally's own behavior of freezing invoice-time details.

create table public.vouchers (
  id                          uuid primary key default gen_random_uuid(),
  company_id                  uuid not null references public.companies (id) on delete cascade,
  book_key                    text not null check (book_key in ('invoice')),
  voucher_no                  text,
  voucher_date                date not null,
  due_date                    date,
  party_id                    uuid references public.parties (id),
  ship_to_party_id            uuid references public.parties (id),
  reference_no                text not null default '',
  subject_ref                 text not null default '',
  place_of_supply_state       text not null default '',
  place_of_supply_state_code  text not null default '',
  is_registered_party         boolean not null default false,
  status                      text not null default 'draft' check (status in ('draft', 'posted', 'cancelled')),
  payment_status               text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  subtotal                    numeric not null default 0,
  cgst_total                  numeric not null default 0,
  sgst_total                  numeric not null default 0,
  igst_total                  numeric not null default 0,
  rounding                    numeric not null default 0,
  grand_total                 numeric not null default 0,
  notes                       text not null default '',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  -- A voucher_no is only assigned at posting time (see
  -- 0010_post_voucher_rpc.sql) -- draft rows have it null, but a posted
  -- row must have one, and it must be unique per company+book.
  constraint vouchers_posted_has_number check (status <> 'posted' or voucher_no is not null)
);

create unique index vouchers_company_book_no_idx on public.vouchers (company_id, book_key, voucher_no)
  where voucher_no is not null;
create index vouchers_company_book_date_idx on public.vouchers (company_id, book_key, voucher_date desc);

alter table public.vouchers enable row level security;

create policy "select own vouchers" on public.vouchers
  for select
  using (public.owns_company(company_id));

create policy "insert own vouchers" on public.vouchers
  for insert
  with check (public.owns_company(company_id));

create policy "update own vouchers" on public.vouchers
  for update
  using (public.owns_company(company_id))
  with check (public.owns_company(company_id));

create policy "delete own vouchers" on public.vouchers
  for delete
  using (public.owns_company(company_id));

grant select, insert, update, delete on public.vouchers to authenticated;

create trigger vouchers_set_updated_at
before update on public.vouchers
for each row
execute function public.set_updated_at();

-- Deleting a posted voucher would cascade-delete its journal_entries/
-- stock_ledger rows, silently destroying the audit trail (see the "delete
-- own journal entries" policy note in 0008_journal_entries.sql -- there
-- isn't one, on purpose). A draft can be deleted freely; a posted voucher
-- must be reversed via new entries once that flow exists, never deleted.
create or replace function public.forbid_deleting_posted_voucher()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'posted' then
    raise exception 'Cannot delete a posted voucher (%); amend it with reversing entries instead.', old.voucher_no;
  end if;
  return old;
end;
$$;

create trigger vouchers_forbid_delete_posted
before delete on public.vouchers
for each row
execute function public.forbid_deleting_posted_voucher();
