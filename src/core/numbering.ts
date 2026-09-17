/**
 * MinimalBooks
 * core/numbering.ts
 *
 * Financial-year-aware voucher numbering helpers. TS port of Mbooks'
 * app/core/numbering.py. The actual allocation (insert-if-missing +
 * increment) only ever happens inside the post_sales_invoice RPC
 * (supabase/migrations/0010_post_voucher_rpc.sql, row-locked there) --
 * this module is for client-side preview only: showing "this invoice will
 * be numbered ~26-27/004" on a blank form before it's saved. That preview
 * can go stale if another save happens first (same tradeoff Mbooks'
 * peek_next_voucher_number accepted); the real number is only assigned,
 * and can't collide, at actual post time.
 */

/** Indian financial year runs Apr-Mar. Returns short form like "26-27". */
export function financialYearFor(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const shortStart = String(startYear % 100).padStart(2, "0");
  const shortEnd = String((startYear + 1) % 100).padStart(2, "0");
  return `${shortStart}-${shortEnd}`;
}

/** Formats {fy}/{seq:03d}-style patterns -- the only pattern shape this
 *  app uses, matching numbering_series.format_pattern's default. */
export function formatVoucherNumber(fy: string, seq: number, pattern = "{fy}/{seq:03d}"): string {
  return pattern
    .replace("{fy}", fy)
    .replace(/\{seq:0(\d+)d\}/, (_match, width: string) => String(seq).padStart(Number(width), "0"));
}
