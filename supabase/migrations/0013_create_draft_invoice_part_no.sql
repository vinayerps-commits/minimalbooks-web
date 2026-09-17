-- MinimalBooks
-- supabase/migrations/0013_create_draft_invoice_part_no.sql
--
-- Redefines create_draft_invoice (originally in 0010_post_voucher_rpc.sql)
-- to also store part_no per line (added by 0012_voucher_lines_part_no.sql).
-- Never edit an already-applied migration in place -- this is the correct
-- way to change a function once it's live: `create or replace` in a new
-- migration.

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
      company_id, voucher_id, line_no, item_id, part_no, description, hsn_sac, qty, unit, rate, tax_percent,
      cgst_amt, sgst_amt, igst_amt, line_total
    ) values (
      p_company_id, v_voucher_id, v_line_no,
      nullif(v_line ->> 'itemId', '')::uuid,
      coalesce(v_line ->> 'partNo', ''),
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
