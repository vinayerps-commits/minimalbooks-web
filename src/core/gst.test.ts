import { describe, expect, it } from "vitest";
import { lineTaxTotal, roundToRupee, splitLineTax } from "./gst";

describe("splitLineTax", () => {
  it("splits intra-state 18% into equal CGST+SGST halves", () => {
    const tax = splitLineTax(1000, 18, "27", "27");
    expect(tax).toEqual({ cgst: 90, sgst: 90, igst: 0 });
    expect(lineTaxTotal(tax)).toBe(180);
  });

  it("charges inter-state as IGST only", () => {
    const tax = splitLineTax(1000, 18, "27", "29");
    expect(tax).toEqual({ cgst: 0, sgst: 0, igst: 180 });
  });

  it("handles a 12% intra-state split with odd half-paise", () => {
    const tax = splitLineTax(250, 12, "27", "27");
    // taxAmount = 30, half = 15
    expect(tax).toEqual({ cgst: 15, sgst: 15, igst: 0 });
  });

  it("treats a blank place-of-supply state code as inter-state (no split)", () => {
    const tax = splitLineTax(1000, 18, "27", "");
    expect(tax).toEqual({ cgst: 0, sgst: 0, igst: 180 });
  });
});

describe("roundToRupee", () => {
  it("rounds down with a negative adjustment", () => {
    // e.g. a grand total of 1180.20 -> rounds to 1180, adjustment -0.20
    const result = roundToRupee(1180.2);
    expect(result.rounded).toBe(1180);
    expect(result.adjustment).toBe(-0.2);
  });

  it("rounds up with a positive adjustment", () => {
    const result = roundToRupee(1180.8);
    expect(result.rounded).toBe(1181);
    expect(result.adjustment).toBeCloseTo(0.2);
  });

  it("has zero adjustment for an already-whole amount", () => {
    const result = roundToRupee(1180);
    expect(result.rounded).toBe(1180);
    expect(result.adjustment).toBe(0);
  });
});
