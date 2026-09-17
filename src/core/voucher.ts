/**
 * MinimalBooks
 * core/voucher.ts
 *
 * Shared voucher/line types plus a client-side totals preview -- computes
 * the same subtotal/CGST/SGST/IGST/rounding/grand_total the
 * create_draft_invoice/post_sales_invoice RPCs compute server-side (see
 * supabase/migrations/0010_post_voucher_rpc.sql), using core/gst.ts, so
 * the InvoiceForm can show live totals before the line is ever saved.
 * The RPC is still the source of truth at save time -- this is a preview,
 * not a second posting path.
 */

import { lineTaxTotal, roundToRupee, splitLineTax, type LineTax } from "./gst";

export type VoucherStatus = "draft" | "posted" | "cancelled";

export interface VoucherLineInput {
  itemId: string | null;
  partNo: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  taxPercent: number;
}

export interface VoucherLine extends VoucherLineInput {
  id: string;
  cgstAmt: number;
  sgstAmt: number;
  igstAmt: number;
  lineTotal: number;
}

export interface Voucher {
  id: string;
  bookKey: string;
  voucherNo: string | null;
  voucherDate: string;
  dueDate: string | null;
  partyId: string | null;
  shipToPartyId: string | null;
  referenceNo: string;
  subjectRef: string;
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  isRegisteredParty: boolean;
  status: VoucherStatus;
  paymentStatus: "unpaid" | "paid";
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  rounding: number;
  grandTotal: number;
  notes: string;
}

export interface VoucherTotals {
  lines: (VoucherLineInput & { taxableValue: number; tax: LineTax; lineTotal: number })[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  rounding: number;
  grandTotal: number;
}

export function computeVoucherTotals(
  lines: VoucherLineInput[],
  supplierStateCode: string,
  placeOfSupplyStateCode: string,
): VoucherTotals {
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const computedLines = lines.map((line) => {
    const taxableValue = round2(line.qty * line.rate);
    const tax = splitLineTax(taxableValue, line.taxPercent, supplierStateCode, placeOfSupplyStateCode);
    subtotal += taxableValue;
    cgstTotal += tax.cgst;
    sgstTotal += tax.sgst;
    igstTotal += tax.igst;
    return { ...line, taxableValue, tax, lineTotal: taxableValue + lineTaxTotal(tax) };
  });

  const { rounded, adjustment } = roundToRupee(subtotal + cgstTotal + sgstTotal + igstTotal);

  return {
    lines: computedLines,
    subtotal: round2(subtotal),
    cgstTotal: round2(cgstTotal),
    sgstTotal: round2(sgstTotal),
    igstTotal: round2(igstTotal),
    rounding: adjustment,
    grandTotal: rounded,
  };
}

function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
