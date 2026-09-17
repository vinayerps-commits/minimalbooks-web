-- MinimalBooks
-- supabase/migrations/0010_post_voucher_rpc.sql
--
-- The posting engine, ported from Mbooks' app/core/ledger.py + gst.py +
-- numbering.py into Postgres functions so a multi-step save is one atomic
-- call from a static SPA with no server-side transaction primitive of its
-- own (a plpgsql function body is atomic by default: any exception rolls
-- back everything it did). All functions run `security invoker` (not
-- `security definer`) so Row Level Security still applies to every insert/
-- update they perform -- these functions have no elevated privilege, they
-- just buy atomicity.
--
-- Two-step by design (create_draft_invoice, then post_sales_invoice):
-- Mbooks' own save_and_post_invoice() docstring warns that allocating a
-- voucher number outside the save transaction can permanently burn a
-- number if the rest of the save fails -- a real risk that gets WORSE, not
-- better, over a network with no client-side multi-table transaction. A
-- draft never touches numbering_series/journal_entries/stock_ledger at
-- all; only post_sales_invoice allocates a number and posts, and it
-- re-derives GST fresh from the currently-stored voucher_lines rather
-- than trusting draft-time totals, so a future edit-draft screen (not
-- built in Phase 1) can't silently post stale tax amounts.

-- ---------------------------------------------------------------------
-- Helpers (TS equivalents: src/core/gst.ts, src/core/numbering.ts --
-- kept in sync by shared test cases, see gst.test.ts/numbering.test.ts;
-- this SQL version is what actually executes atomically).
-- ---------------------------------------------------------------------

create or replace function public.gst_split_line_tax(
  p_taxable_value numeric,
  p_tax_percent numeric,
  p_supplier_state_code text,
  p_place_of_supply_state_code text
) returns table (cgst numeric, sgst numeric, igst numeric)
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_tax_amount numeric;
  v_half numeric;
begin
  v_tax_amount := round(p_taxable_value * p_tax_percent / 100.0, 2);
  if p_place_of_supply_state_code is not null and p_place_of_supply_state_code <> ''
     and p_place_of_supply_state_code = p_supplier_state_code then
    v_half := round(v_tax_amount / 2.0, 2);
    return query select v_half, v_half, 0::numeric;
  else
    return query select 0::numeric, 0::numeric, v_tax_amount;
  end if;
end;
$$;

create or replace function public.gst_round_to_rupee(p_amount numeric)
returns table (rounded numeric, adjustment numeric)
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  return query select round(p_amount, 0), round(round(p_amount, 0) - p_amount, 2);
end;
$$;

create or replace function public.financial_year_for(p_date date)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select lpad((start_year % 100)::text, 2, '0') || '-' || lpad(((start_year + 1) % 100)::text, 2, '0')
  from (
    select case when extract(month from p_date)::int >= 4
                then extract(year from p_date)::int
                else extract(year from p_date)::int - 1
           end as start_year
  ) s;
$$;

grant execute on function public.gst_split_line_tax(numeric, numeric, text, text) to authenticated;
grant execute on function public.gst_round_to_rupee(numeric) to authenticated;
grant execute on function public.financial_year_for(date) to authenticated;

-- ---------------------------------------------------------------------
-- create_draft_invoice: inserts the voucher (status='draft', voucher_no
-- null) and its lines, computing GST/totals so a draft already displays
-- correct-looking numbers before posting. Never touches numbering_series,
-- journal_entries, or stock_ledger.
--
-- p_lines shape: jsonb array of
--   {"itemId": uuid|null, "description": text, "hsnSac": text,
--    "qty": number, "unit": text, "rate": number, "taxPercent": number}
-- ---------------------------------------------------------------------

create or replace function public.create_draft_invoice(
  p_company_id uuid,
  p_voucher_date date,
  p_due_date date,
  p_party_id uuid,
  p_ship_to_party_id uuid,
  p_place_of_supply_state text,
  p_place_of_supply_state_code text,
  p_reference_no text,
  p_subject_ref text,
  p_notes text,
  p_lines jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_voucher_id uuid;
  v_supplier_state_code text;
  v_line jsonb;
  v_line_no integer := 0;
  v_taxable numeric;
  v_tax record;
  v_subtotal numeric := 0;
  v_cgst numeric := 0;
  v_sgst numeric := 0;
  v_igst numeric := 0;
  v_round record;
begin
  select state_code into v_supplier_state_code from public.companies where id = p_company_id;

  insert into public.vouchers (
    company_id, book_key, voucher_date, due_date, party_id, ship_to_party_id,
    reference_no, subject_ref, place_of_supply_state, place_of_supply_state_code, notes, status
  ) values (
    p_company_id, 'invoice', p_voucher_date, p_due_date, p_party_id, p_ship_to_party_id,
    coalesce(p_reference_no, ''), coalesce(p_subject_ref, ''), coalesce(p_place_of_supply_state, ''),
    coalesce(p_place_of_supply_state_code, ''), coalesce(p_notes, ''), 'draft'
  ) returning id into v_voucher_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_line_no := v_line_no + 1;
    v_taxable := round((v_line ->> 'qty')::numeric * (v_line ->> 'rate')::numeric, 2);
    select * into v_tax from public.gst_split_line_tax(
      v_taxable, (v_line ->> 'taxPercent')::numeric, v_supplier_state_code, coalesce(p_place_of_supply_state_code, '')
    );

    insert into public.voucher_lines (
      company_id, voucher_id, line_no, item_id, description, hsn_sac, qty, unit, rate, tax_percent,
      cgst_amt, sgst_amt, igst_amt, line_total
    ) values (
      p_company_id, v_voucher_id, v_line_no,
      nullif(v_line ->> 'itemId', '')::uuid,
      coalesce(v_line ->> 'description', ''), coalesce(v_line ->> 'hsnSac', ''),
      (v_line ->> 'qty')::numeric, coalesce(v_line ->> 'unit', ''), (v_line ->> 'rate')::numeric,
      (v_line ->> 'taxPercent')::numeric,
      v_tax.cgst, v_tax.sgst, v_tax.igst,
      v_taxable + v_tax.cgst + v_tax.sgst + v_tax.igst
    );

    v_subtotal := v_subtotal + v_taxable;
    v_cgst := v_cgst + v_tax.cgst;
    v_sgst := v_sgst + v_tax.sgst;
    v_igst := v_igst + v_tax.igst;
  end loop;

  select * into v_round from public.gst_round_to_rupee(v_subtotal + v_cgst + v_sgst + v_igst);

  update public.vouchers set
    subtotal = v_subtotal,
    cgst_total = v_cgst,
    sgst_total = v_sgst,
    igst_total = v_igst,
    rounding = v_round.adjustment,
    grand_total = v_round.rounded
  where id = v_voucher_id;

  return v_voucher_id;
end;
$$;

grant execute on function public.create_draft_invoice(
  uuid, date, date, uuid, uuid, text, text, text, text, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------
-- post_sales_invoice: promotes a draft to posted -- allocates the voucher
-- number (row-locking numbering_series, the Postgres-native replacement
-- for SQLite's BEGIN IMMEDIATE), recomputes GST fresh from the currently-
-- stored lines, writes the balanced journal entries, and records stock
-- movement for goods/raw_material lines. Returns the assigned voucher_no.
-- ---------------------------------------------------------------------

create or replace function public.post_sales_invoice(p_voucher_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_voucher public.vouchers%rowtype;
  v_company_id uuid;
  v_fy text;
  v_seq integer;
  v_format text;
  v_voucher_no text;
  v_supplier_state_code text;
  v_line public.voucher_lines%rowtype;
  v_tax record;
  v_taxable numeric;
  v_subtotal numeric := 0;
  v_cgst numeric := 0;
  v_sgst numeric := 0;
  v_igst numeric := 0;
  v_round record;
  v_registered boolean;
  v_debtors uuid;
  v_sales uuid;
  v_cgst_acct uuid;
  v_sgst_acct uuid;
  v_igst_acct uuid;
  v_rounding_acct uuid;
  v_narration text;
begin
  select * into v_voucher from public.vouchers where id = p_voucher_id for update;
  if not found then
    raise exception 'Voucher not found';
  end if;
  if v_voucher.status <> 'draft' then
    raise exception 'Only a draft voucher can be posted (current status: %)', v_voucher.status;
  end if;
  v_company_id := v_voucher.company_id;

  select state_code into v_supplier_state_code from public.companies where id = v_company_id;

  -- Recompute GST fresh from voucher_lines (not from the draft's stored
  -- header totals) so posting always reflects the lines as they currently
  -- stand.
  for v_line in select * from public.voucher_lines where voucher_id = p_voucher_id order by line_no
  loop
    v_taxable := round(v_line.qty * v_line.rate, 2);
    select * into v_tax from public.gst_split_line_tax(
      v_taxable, v_line.tax_percent, v_supplier_state_code, v_voucher.place_of_supply_state_code
    );
    update public.voucher_lines set
      cgst_amt = v_tax.cgst, sgst_amt = v_tax.sgst, igst_amt = v_tax.igst,
      line_total = v_taxable + v_tax.cgst + v_tax.sgst + v_tax.igst
    where id = v_line.id;

    v_subtotal := v_subtotal + v_taxable;
    v_cgst := v_cgst + v_tax.cgst;
    v_sgst := v_sgst + v_tax.sgst;
    v_igst := v_igst + v_tax.igst;
  end loop;

  select * into v_round from public.gst_round_to_rupee(v_subtotal + v_cgst + v_sgst + v_igst);

  -- Numbering: row-locked per company+book+financial_year so a concurrent
  -- post can't read a stale next_seq.
  v_fy := public.financial_year_for(v_voucher.voucher_date);

  insert into public.numbering_series (company_id, book_key, financial_year, next_seq, format_pattern)
  values (v_company_id, v_voucher.book_key, v_fy, 1, '{fy}/{seq:03d}')
  on conflict (company_id, book_key, financial_year) do nothing;

  select next_seq, format_pattern into v_seq, v_format
  from public.numbering_series
  where company_id = v_company_id and book_key = v_voucher.book_key and financial_year = v_fy
  for update;

  update public.numbering_series
  set next_seq = next_seq + 1
  where company_id = v_company_id and book_key = v_voucher.book_key and financial_year = v_fy;

  -- format_pattern is always '{fy}/{seq:03d}' today (no UI to customize
  -- it yet -- see Phase 5's Numbering Series settings placeholder), so a
  -- fixed 3-digit pad is safe; revisit if that ever becomes configurable.
  v_voucher_no := replace(replace(v_format, '{fy}', v_fy), '{seq:03d}', lpad(v_seq::text, 3, '0'));

  select (gst_registration_type = 'registered') into v_registered
  from public.parties where id = v_voucher.party_id;

  select id into v_debtors from public.chart_of_accounts where company_id = v_company_id and code = '1001';
  select id into v_sales from public.chart_of_accounts where company_id = v_company_id and code = '3001';
  select id into v_cgst_acct from public.chart_of_accounts where company_id = v_company_id and code = '2101';
  select id into v_sgst_acct from public.chart_of_accounts where company_id = v_company_id and code = '2102';
  select id into v_igst_acct from public.chart_of_accounts where company_id = v_company_id and code = '2103';
  select id into v_rounding_acct from public.chart_of_accounts where company_id = v_company_id and code = '4001';

  if v_debtors is null or v_sales is null or v_cgst_acct is null or v_sgst_acct is null
     or v_igst_acct is null or v_rounding_acct is null then
    raise exception 'Chart of accounts is missing a required account (1001/3001/2101/2102/2103/4001)';
  end if;

  update public.vouchers set
    voucher_no = v_voucher_no,
    status = 'posted',
    is_registered_party = coalesce(v_registered, false),
    subtotal = v_subtotal,
    cgst_total = v_cgst,
    sgst_total = v_sgst,
    igst_total = v_igst,
    rounding = v_round.adjustment,
    grand_total = v_round.rounded
  where id = p_voucher_id;

  v_narration := 'Sales Invoice ' || v_voucher_no;

  insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
  values (v_company_id, p_voucher_id, v_debtors, v_round.rounded, 0, v_voucher.voucher_date, v_narration);

  if v_subtotal <> 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_sales, 0, v_subtotal, v_voucher.voucher_date, v_narration);
  end if;
  if v_cgst <> 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_cgst_acct, 0, v_cgst, v_voucher.voucher_date, v_narration);
  end if;
  if v_sgst <> 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_sgst_acct, 0, v_sgst, v_voucher.voucher_date, v_narration);
  end if;
  if v_igst <> 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_igst_acct, 0, v_igst, v_voucher.voucher_date, v_narration);
  end if;

  if v_round.adjustment > 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_rounding_acct, 0, v_round.adjustment, v_voucher.voucher_date, v_narration);
  elsif v_round.adjustment < 0 then
    insert into public.journal_entries (company_id, voucher_id, account_id, debit, credit, entry_date, narration)
    values (v_company_id, p_voucher_id, v_rounding_acct, -v_round.adjustment, 0, v_voucher.voucher_date, v_narration);
  end if;

  insert into public.stock_ledger (company_id, voucher_id, item_id, movement_date, qty_in, qty_out, rate)
  select v_company_id, p_voucher_id, vl.item_id, v_voucher.voucher_date, 0, vl.qty, vl.rate
  from public.voucher_lines vl
  join public.items i on i.id = vl.item_id
  where vl.voucher_id = p_voucher_id and i.item_type in ('goods', 'raw_material');

  return v_voucher_no;
end;
$$;

grant execute on function public.post_sales_invoice(uuid) to authenticated;
