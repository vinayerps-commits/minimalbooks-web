import { describe, expect, it } from "vitest";
import { DEFAULT_CHART_OF_ACCOUNTS } from "./defaultChartOfAccounts";

describe("DEFAULT_CHART_OF_ACCOUNTS", () => {
  it("has unique codes", () => {
    const codes = DEFAULT_CHART_OF_ACCOUNTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  // These specific codes are load-bearing: Mbooks' ledger.py posts against
  // them by code (C:\Users\padek\Mbooks\app\core\ledger.py's
  // _account_id("1001") etc.), and Phase 1's posting engine reuses the
  // same codes unchanged.
  it("includes every account Mbooks' posting engine references by code", () => {
    const codes = new Set(DEFAULT_CHART_OF_ACCOUNTS.map((a) => a.code));
    for (const required of ["1001", "3001", "2101", "2102", "2103", "4001"]) {
      expect(codes.has(required)).toBe(true);
    }
  });
});
