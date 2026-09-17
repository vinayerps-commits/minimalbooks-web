/**
 * MinimalBooks
 * core/defaultChartOfAccounts.ts
 *
 * The starter chart of accounts seeded once, at company-creation time, by
 * io/chartOfAccounts.ts's seedDefaults(). Codes for the accounts Mbooks'
 * ledger.py already posts against (Sundry Debtors, Sales, Output
 * CGST/SGST/IGST, Rounding Off) are kept identical to that prototype
 * (C:\Users\padek\Mbooks\app\core\ledger.py) so the Phase 1 posting engine
 * can reuse these exact codes without renumbering. Input-tax and Purchases
 * accounts are added ahead of Phase 2 (they're inert until then).
 */

import type { Account } from "./types";

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<Account, "id">[] = [
  { code: "1001", name: "Sundry Debtors", type: "asset", isGroup: false },
  { code: "1002", name: "Cash", type: "asset", isGroup: false },
  { code: "1003", name: "Bank", type: "asset", isGroup: false },
  { code: "2001", name: "Sundry Creditors", type: "liability", isGroup: false },
  { code: "2101", name: "Output CGST", type: "liability", isGroup: false },
  { code: "2102", name: "Output SGST", type: "liability", isGroup: false },
  { code: "2103", name: "Output IGST", type: "liability", isGroup: false },
  { code: "2201", name: "Input CGST", type: "asset", isGroup: false },
  { code: "2202", name: "Input SGST", type: "asset", isGroup: false },
  { code: "2203", name: "Input IGST", type: "asset", isGroup: false },
  { code: "3001", name: "Sales", type: "income", isGroup: false },
  { code: "4001", name: "Rounding Off", type: "expense", isGroup: false },
  { code: "5001", name: "Purchases", type: "expense", isGroup: false },
];
