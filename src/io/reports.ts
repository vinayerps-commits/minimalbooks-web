/**
 * MinimalBooks
 * io/reports.ts
 *
 * Data access for the GST summary views (supabase/migrations/0011_gst_reporting_views.sql).
 * Read-only -- these are views over posted vouchers, nothing here writes.
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";

export interface Gstr1B2bRow {
  partyId: string;
  partyName: string;
  partyGstin: string;
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  invoiceCount: number;
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
}

export async function gstr1B2bSummary(companyId: string): Promise<Result<Gstr1B2bRow[]>> {
  const { data, error } = await getSupabaseClient()
    .from("gstr1_b2b_summary")
    .select(
      "party_id, party_name, party_gstin, place_of_supply_state, place_of_supply_state_code, invoice_count, taxable_value, cgst_total, sgst_total, igst_total, grand_total",
    )
    .eq("company_id", companyId)
    .order("party_name");
  if (error) return { ok: false, error: describeError(error) };
  return {
    ok: true,
    value: data.map((r) => ({
      partyId: r.party_id,
      partyName: r.party_name,
      partyGstin: r.party_gstin,
      placeOfSupplyState: r.place_of_supply_state,
      placeOfSupplyStateCode: r.place_of_supply_state_code,
      invoiceCount: r.invoice_count,
      taxableValue: r.taxable_value,
      cgstTotal: r.cgst_total,
      sgstTotal: r.sgst_total,
      igstTotal: r.igst_total,
      grandTotal: r.grand_total,
    })),
  };
}

export interface Gstr1B2cRow {
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  invoiceCount: number;
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
}

export async function gstr1B2cSummary(companyId: string): Promise<Result<Gstr1B2cRow[]>> {
  const { data, error } = await getSupabaseClient()
    .from("gstr1_b2c_summary")
    .select(
      "place_of_supply_state, place_of_supply_state_code, invoice_count, taxable_value, cgst_total, sgst_total, igst_total, grand_total",
    )
    .eq("company_id", companyId)
    .order("place_of_supply_state");
  if (error) return { ok: false, error: describeError(error) };
  return {
    ok: true,
    value: data.map((r) => ({
      placeOfSupplyState: r.place_of_supply_state,
      placeOfSupplyStateCode: r.place_of_supply_state_code,
      invoiceCount: r.invoice_count,
      taxableValue: r.taxable_value,
      cgstTotal: r.cgst_total,
      sgstTotal: r.sgst_total,
      igstTotal: r.igst_total,
      grandTotal: r.grand_total,
    })),
  };
}

export interface HsnSummaryRow {
  hsnSac: string;
  taxPercent: number;
  unit: string;
  totalQty: number;
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalValue: number;
}

export async function hsnSummary(companyId: string): Promise<Result<HsnSummaryRow[]>> {
  const { data, error } = await getSupabaseClient()
    .from("hsn_summary")
    .select(
      "hsn_sac, tax_percent, unit, total_qty, taxable_value, cgst_total, sgst_total, igst_total, total_value",
    )
    .eq("company_id", companyId)
    .order("hsn_sac");
  if (error) return { ok: false, error: describeError(error) };
  return {
    ok: true,
    value: data.map((r) => ({
      hsnSac: r.hsn_sac,
      taxPercent: r.tax_percent,
      unit: r.unit,
      totalQty: r.total_qty,
      taxableValue: r.taxable_value,
      cgstTotal: r.cgst_total,
      sgstTotal: r.sgst_total,
      igstTotal: r.igst_total,
      totalValue: r.total_value,
    })),
  };
}

export interface Gstr3bRow {
  financialYear: string;
  period: string;
  outwardTaxableValue: number;
  outwardCgst: number;
  outwardSgst: number;
  outwardIgst: number;
  itcCgst: number;
  itcSgst: number;
  itcIgst: number;
  netCgstPayable: number;
  netSgstPayable: number;
  netIgstPayable: number;
}

export async function gstr3bSummary(companyId: string): Promise<Result<Gstr3bRow[]>> {
  const { data, error } = await getSupabaseClient()
    .from("gstr3b_summary")
    .select(
      "financial_year, period, outward_taxable_value, outward_cgst, outward_sgst, outward_igst, itc_cgst, itc_sgst, itc_igst, net_cgst_payable, net_sgst_payable, net_igst_payable",
    )
    .eq("company_id", companyId)
    .order("period", { ascending: false });
  if (error) return { ok: false, error: describeError(error) };
  return {
    ok: true,
    value: data.map((r) => ({
      financialYear: r.financial_year,
      period: r.period,
      outwardTaxableValue: r.outward_taxable_value,
      outwardCgst: r.outward_cgst,
      outwardSgst: r.outward_sgst,
      outwardIgst: r.outward_igst,
      itcCgst: r.itc_cgst,
      itcSgst: r.itc_sgst,
      itcIgst: r.itc_igst,
      netCgstPayable: r.net_cgst_payable,
      netSgstPayable: r.net_sgst_payable,
      netIgstPayable: r.net_igst_payable,
    })),
  };
}
