-- MinimalBooks
-- supabase/migrations/0011_gst_reporting_views.sql
--
-- GSTR-1/GSTR-3B/HSN summary views. The base tables already carry
-- everything these need (cgst_amt/sgst_amt/igst_amt, hsn_sac,
-- place_of_supply_state_code, is_registered_party frozen at posting time)
-- -- what was missing was the aggregation shape, added here as views, not
-- new base tables. `security_invoker = true` makes each view inherit the
-- querying user's own RLS on the underlying tables rather than needing
-- separate policies of its own.
--
-- GSTR-3B's ITC side is hardcoded to 0 here: there are no purchase bills
-- yet (that's Phase 2), so there is genuinely nothing to sum. The UI
-- should show this as "pending purchase bills", not silently present it
-- as a real zero ITC figure.

create view public.gstr1_b2b_summary
with (security_invoker = true) as
select
  v.company_id,
  v.party_id,
  p.name as party_name,
  p.gstin as party_gstin,
  v.place_of_supply_state as place_of_supply_state,
  v.place_of_supply_state_code as place_of_supply_state_code,
  count(*) as invoice_count,
  sum(v.subtotal) as taxable_value,
  sum(v.cgst_total) as cgst_total,
  sum(v.sgst_total) as sgst_total,
  sum(v.igst_total) as igst_total,
  sum(v.grand_total) as grand_total
from public.vouchers v
join public.parties p on p.id = v.party_id
where v.book_key = 'invoice' and v.status = 'posted' and v.is_registered_party
group by v.company_id, v.party_id, p.name, p.gstin, v.place_of_supply_state, v.place_of_supply_state_code;

create view public.gstr1_b2c_summary
with (security_invoker = true) as
select
  v.company_id,
  v.place_of_supply_state as place_of_supply_state,
  v.place_of_supply_state_code as place_of_supply_state_code,
  count(*) as invoice_count,
  sum(v.subtotal) as taxable_value,
  sum(v.cgst_total) as cgst_total,
  sum(v.sgst_total) as sgst_total,
  sum(v.igst_total) as igst_total,
  sum(v.grand_total) as grand_total
from public.vouchers v
where v.book_key = 'invoice' and v.status = 'posted' and not v.is_registered_party
group by v.company_id, v.place_of_supply_state, v.place_of_supply_state_code;

create view public.hsn_summary
with (security_invoker = true) as
select
  vl.company_id,
  vl.hsn_sac,
  vl.tax_percent,
  vl.unit,
  sum(vl.qty) as total_qty,
  sum(vl.qty * vl.rate) as taxable_value,
  sum(vl.cgst_amt) as cgst_total,
  sum(vl.sgst_amt) as sgst_total,
  sum(vl.igst_amt) as igst_total,
  sum(vl.line_total) as total_value
from public.voucher_lines vl
join public.vouchers v on v.id = vl.voucher_id
where v.book_key = 'invoice' and v.status = 'posted'
group by vl.company_id, vl.hsn_sac, vl.tax_percent, vl.unit;

create view public.gstr3b_summary
with (security_invoker = true) as
select
  v.company_id,
  public.financial_year_for(v.voucher_date) as financial_year,
  to_char(v.voucher_date, 'YYYY-MM') as period,
  sum(v.subtotal) as outward_taxable_value,
  sum(v.cgst_total) as outward_cgst,
  sum(v.sgst_total) as outward_sgst,
  sum(v.igst_total) as outward_igst,
  0::numeric as itc_cgst,   -- pending Phase 2 purchase bills
  0::numeric as itc_sgst,   -- pending Phase 2 purchase bills
  0::numeric as itc_igst,   -- pending Phase 2 purchase bills
  sum(v.cgst_total) as net_cgst_payable,
  sum(v.sgst_total) as net_sgst_payable,
  sum(v.igst_total) as net_igst_payable
from public.vouchers v
where v.book_key = 'invoice' and v.status = 'posted'
group by v.company_id, public.financial_year_for(v.voucher_date), to_char(v.voucher_date, 'YYYY-MM');
