import { describe, expect, it } from "vitest";
import { financialYearFor, formatVoucherNumber } from "./numbering";

describe("financialYearFor", () => {
  it("returns the same FY for a date in April (start of FY)", () => {
    expect(financialYearFor(new Date(Date.UTC(2026, 3, 1)))).toBe("26-27");
  });

  it("returns the previous-year-start FY for a date in March (end of FY)", () => {
    expect(financialYearFor(new Date(Date.UTC(2026, 2, 31)))).toBe("25-26");
  });

  it("returns the same FY for a date in December", () => {
    expect(financialYearFor(new Date(Date.UTC(2026, 11, 15)))).toBe("26-27");
  });
});

describe("formatVoucherNumber", () => {
  it("formats with the default zero-padded 3-digit pattern", () => {
    expect(formatVoucherNumber("26-27", 79)).toBe("26-27/079");
  });

  it("formats a 4-digit sequence without truncation", () => {
    expect(formatVoucherNumber("26-27", 1234)).toBe("26-27/1234");
  });
});
