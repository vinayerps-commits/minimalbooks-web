/**
 * MinimalBooks
 * core/gst.ts
 *
 * GST split (CGST+SGST vs IGST) and rupee rounding, matching Indian GST
 * invoice rules. TS port of Mbooks' app/core/gst.py -- same rules, same
 * function shapes, so the plpgsql version in the post_sales_invoice RPC
 * (supabase/migrations/0010_post_voucher_rpc.sql) can be checked against
 * this file's test cases.
 */

export interface LineTax {
  cgst: number;
  sgst: number;
  igst: number;
}

export function lineTaxTotal(tax: LineTax): number {
  return round2(tax.cgst + tax.sgst + tax.igst);
}

function round2(amount: number): number {
  // Standard commercial rounding (half up), not banker's rounding -- what
  // Indian GST invoices and most accounting software use for currency.
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Intra-state (place of supply's state code == supplier's state code)
 *  splits the rate into equal CGST+SGST halves; inter-state charges the
 *  full rate as IGST. */
export function splitLineTax(
  taxableValue: number,
  taxPercent: number,
  supplierStateCode: string,
  placeOfSupplyStateCode: string,
): LineTax {
  const taxAmount = round2((taxableValue * taxPercent) / 100);
  if (placeOfSupplyStateCode && placeOfSupplyStateCode === supplierStateCode) {
    const half = round2(taxAmount / 2);
    return { cgst: half, sgst: half, igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: taxAmount };
}

export interface RoundedTotal {
  rounded: number;
  adjustment: number;
}

/** Rounds to the nearest whole rupee. adjustment = rounded - amount
 *  (matches the sample invoice's "Rounding -0.20" convention: a negative
 *  adjustment means the rounded total is less than the raw total). */
export function roundToRupee(amount: number): RoundedTotal {
  const rounded = Math.round(amount);
  return { rounded, adjustment: round2(rounded - amount) };
}
