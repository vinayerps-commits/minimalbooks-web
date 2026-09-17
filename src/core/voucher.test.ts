import { describe, expect, it } from "vitest";
import { computeVoucherTotals, type VoucherLineInput } from "./voucher";

describe("computeVoucherTotals", () => {
  it("sums multiple intra-state lines and rounds the grand total", () => {
    const lines: VoucherLineInput[] = [
      { itemId: "a", description: "Widget", hsnSac: "8481", qty: 2, unit: "Nos", rate: 500, taxPercent: 18 },
      {
        itemId: "b",
        description: "Gadget",
        hsnSac: "8482",
        qty: 1,
        unit: "Nos",
        rate: 300.5,
        taxPercent: 12,
      },
    ];
    const totals = computeVoucherTotals(lines, "27", "27");

    // line 1: taxable 1000, tax 180 (90+90)
    // line 2: taxable 300.5, tax 36.06 (18.03+18.03)
    expect(totals.subtotal).toBeCloseTo(1300.5);
    expect(totals.cgstTotal).toBeCloseTo(108.03);
    expect(totals.sgstTotal).toBeCloseTo(108.03);
    expect(totals.igstTotal).toBe(0);
    const rawTotal = 1300.5 + 108.03 + 108.03;
    expect(totals.grandTotal).toBe(Math.round(rawTotal));
  });

  it("uses IGST for inter-state and leaves CGST/SGST at zero", () => {
    const lines: VoucherLineInput[] = [
      { itemId: "a", description: "Widget", hsnSac: "8481", qty: 1, unit: "Nos", rate: 1000, taxPercent: 18 },
    ];
    const totals = computeVoucherTotals(lines, "27", "29");
    expect(totals.cgstTotal).toBe(0);
    expect(totals.sgstTotal).toBe(0);
    expect(totals.igstTotal).toBe(180);
  });
});
