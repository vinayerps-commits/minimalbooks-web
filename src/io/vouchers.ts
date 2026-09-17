/**
 * MinimalBooks
 * io/vouchers.ts
 *
 * Data access for invoices: create a draft, post it, list the register,
 * fetch one voucher with its lines. The actual posting logic (numbering,
 * GST, journal/stock writes) lives entirely in the create_draft_invoice/
 * post_sales_invoice Postgres RPCs (supabase/migrations/0010_post_voucher_rpc.sql)
 * -- this layer just calls them and shapes the results.
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";
import type { Voucher, VoucherLine, VoucherLineInput } from "../core/voucher";

export interface NewInvoiceInput {
  companyId: string;
  voucherDate: string;
  dueDate: string | null;
  partyId: string;
  shipToPartyId: string | null;
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  referenceNo: string;
  subjectRef: string;
  notes: string;
  lines: VoucherLineInput[];
}

/** Creates a draft invoice -- no voucher number allocated, no journal/
 *  stock rows written (see the RPC's own header comment for why this is
 *  split from posting). Returns the new voucher's id. */
export async function createDraftInvoice(input: NewInvoiceInput): Promise<Result<string>> {
  const { data, error } = await getSupabaseClient().rpc("create_draft_invoice", {
    p_company_id: input.companyId,
    p_voucher_date: input.voucherDate,
    p_due_date: input.dueDate,
    p_party_id: input.partyId,
    p_ship_to_party_id: input.shipToPartyId,
    p_place_of_supply_state: input.placeOfSupplyState,
    p_place_of_supply_state_code: input.placeOfSupplyStateCode,
    p_reference_no: input.referenceNo,
    p_subject_ref: input.subjectRef,
    p_notes: input.notes,
    p_lines: input.lines.map((l) => ({
      itemId: l.itemId,
      partNo: l.partNo,
      description: l.description,
      hsnSac: l.hsnSac,
      qty: l.qty,
      unit: l.unit,
      rate: l.rate,
      taxPercent: l.taxPercent,
    })),
  });
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: data as string };
}

/** Allocates the voucher number and posts the ledger/stock entries for a
 *  draft invoice. Returns the assigned voucher number. */
export async function postSalesInvoice(voucherId: string): Promise<Result<string>> {
  const { data, error } = await getSupabaseClient().rpc("post_sales_invoice", { p_voucher_id: voucherId });
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: data as string };
}

/** Convenience: create the draft and post it in one call, for the common
 *  "fill the form, click Save" path. If posting fails, the draft is left
 *  behind (recoverable, no number burned) rather than retried blindly --
 *  callers can surface the draft id in the error path if they want a
 *  "resume this draft" affordance later. */
export async function createAndPostInvoice(
  input: NewInvoiceInput,
): Promise<Result<{ voucherId: string; voucherNo: string }>> {
  const draft = await createDraftInvoice(input);
  if (!draft.ok) return draft;

  const posted = await postSalesInvoice(draft.value);
  if (!posted.ok) return { ok: false, error: `Saved as draft, but posting failed: ${posted.error}` };

  return { ok: true, value: { voucherId: draft.value, voucherNo: posted.value } };
}

interface VoucherRow {
  id: string;
  book_key: string;
  voucher_no: string | null;
  voucher_date: string;
  due_date: string | null;
  party_id: string | null;
  ship_to_party_id: string | null;
  reference_no: string;
  subject_ref: string;
  place_of_supply_state: string;
  place_of_supply_state_code: string;
  is_registered_party: boolean;
  status: Voucher["status"];
  payment_status: Voucher["paymentStatus"];
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  rounding: number;
  grand_total: number;
  notes: string;
}

const VOUCHER_COLUMNS =
  "id, book_key, voucher_no, voucher_date, due_date, party_id, ship_to_party_id, reference_no, subject_ref, place_of_supply_state, place_of_supply_state_code, is_registered_party, status, payment_status, subtotal, cgst_total, sgst_total, igst_total, rounding, grand_total, notes";

function voucherFromRow(row: VoucherRow): Voucher {
  return {
    id: row.id,
    bookKey: row.book_key,
    voucherNo: row.voucher_no,
    voucherDate: row.voucher_date,
    dueDate: row.due_date,
    partyId: row.party_id,
    shipToPartyId: row.ship_to_party_id,
    referenceNo: row.reference_no,
    subjectRef: row.subject_ref,
    placeOfSupplyState: row.place_of_supply_state,
    placeOfSupplyStateCode: row.place_of_supply_state_code,
    isRegisteredParty: row.is_registered_party,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    cgstTotal: row.cgst_total,
    sgstTotal: row.sgst_total,
    igstTotal: row.igst_total,
    rounding: row.rounding,
    grandTotal: row.grand_total,
    notes: row.notes,
  };
}

export interface InvoiceRegisterRow extends Voucher {
  partyName: string | null;
}

/** Lists invoices for the register, most recent first, with the party
 *  name resolved for display (avoids a per-row lookup in the UI). */
export async function listInvoices(companyId: string): Promise<Result<InvoiceRegisterRow[]>> {
  // vouchers has two FKs into parties (party_id and ship_to_party_id), so
  // the embed must name which one via its constraint -- plain
  // "parties(name)" is ambiguous and PostgREST rejects it (PGRST201).
  const { data, error } = await getSupabaseClient()
    .from("vouchers")
    .select(`${VOUCHER_COLUMNS}, parties!vouchers_party_id_fkey(name)`)
    .eq("company_id", companyId)
    .eq("book_key", "invoice")
    .order("voucher_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: describeError(error) };

  const rows = data as unknown as (VoucherRow & { parties: { name: string }[] | { name: string } | null })[];
  return {
    ok: true,
    value: rows.map((r) => {
      const party = Array.isArray(r.parties) ? r.parties[0] : r.parties;
      return { ...voucherFromRow(r), partyName: party?.name ?? null };
    }),
  };
}

interface VoucherLineRow {
  id: string;
  item_id: string | null;
  part_no: string;
  description: string;
  hsn_sac: string;
  qty: number;
  unit: string;
  rate: number;
  tax_percent: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt: number;
  line_total: number;
}

function lineFromRow(row: VoucherLineRow): VoucherLine {
  return {
    id: row.id,
    itemId: row.item_id,
    partNo: row.part_no,
    description: row.description,
    hsnSac: row.hsn_sac,
    qty: row.qty,
    unit: row.unit,
    rate: row.rate,
    taxPercent: row.tax_percent,
    cgstAmt: row.cgst_amt,
    sgstAmt: row.sgst_amt,
    igstAmt: row.igst_amt,
    lineTotal: row.line_total,
  };
}

/** Fetches one invoice with its lines and party name, for viewing/printing. */
export async function getInvoice(
  voucherId: string,
): Promise<Result<{ voucher: Voucher; partyName: string | null; lines: VoucherLine[] }>> {
  const [voucherResult, linesResult] = await Promise.all([
    getSupabaseClient()
      .from("vouchers")
      // See listInvoices' comment on why the party_id FK must be named explicitly.
      .select(`${VOUCHER_COLUMNS}, parties!vouchers_party_id_fkey(name)`)
      .eq("id", voucherId)
      .single(),
    getSupabaseClient()
      .from("voucher_lines")
      .select(
        "id, item_id, part_no, description, hsn_sac, qty, unit, rate, tax_percent, cgst_amt, sgst_amt, igst_amt, line_total",
      )
      .eq("voucher_id", voucherId)
      .order("line_no"),
  ]);

  if (voucherResult.error) return { ok: false, error: describeError(voucherResult.error) };
  if (linesResult.error) return { ok: false, error: describeError(linesResult.error) };

  const voucherRow = voucherResult.data as unknown as VoucherRow & {
    parties: { name: string }[] | { name: string } | null;
  };
  const party = Array.isArray(voucherRow.parties) ? voucherRow.parties[0] : voucherRow.parties;

  return {
    ok: true,
    value: {
      voucher: voucherFromRow(voucherRow),
      partyName: party?.name ?? null,
      lines: (linesResult.data as VoucherLineRow[]).map(lineFromRow),
    },
  };
}
