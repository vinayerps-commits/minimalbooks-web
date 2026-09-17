/**
 * MinimalBooks
 * ui/widgets/LineItemTable.tsx
 *
 * Editable line-item table for InvoiceForm (and future PurchaseBillForm/
 * SalesOrderForm/PurchaseOrderForm, which share this exact shape). Each
 * row's CGST/SGST/IGST/line total shown here is a live preview computed
 * client-side (core/gst.ts) -- the create_draft_invoice/post_sales_invoice
 * RPCs recompute canonically at save/post time; this table never writes
 * anything itself.
 */

import { ItemPicker } from "./ItemPicker";
import { splitLineTax, lineTaxTotal } from "../../core/gst";
import type { VoucherLineInput } from "../../core/voucher";
import type { Item } from "../../core/types";

const BLANK_LINE: VoucherLineInput = {
  itemId: null,
  description: "",
  hsnSac: "",
  qty: 1,
  unit: "Nos",
  rate: 0,
  taxPercent: 0,
};

export function LineItemTable({
  items,
  lines,
  supplierStateCode,
  placeOfSupplyStateCode,
  onChange,
}: {
  items: Item[];
  lines: VoucherLineInput[];
  supplierStateCode: string;
  placeOfSupplyStateCode: string;
  onChange: (lines: VoucherLineInput[]) => void;
}) {
  function updateLine(index: number, patch: Partial<VoucherLineInput>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function selectItem(index: number, item: Item | null) {
    if (!item) {
      updateLine(index, { itemId: null });
      return;
    }
    updateLine(index, {
      itemId: item.id,
      description: item.name,
      hsnSac: item.hsnSac,
      unit: item.unit,
      rate: item.saleRate,
      taxPercent: item.taxPercent,
    });
  }

  function addLine() {
    onChange([...lines, { ...BLANK_LINE }]);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  return (
    <table class="line-item-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Rate</th>
          <th>Tax %</th>
          <th>CGST</th>
          <th>SGST</th>
          <th>IGST</th>
          <th>Line total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => {
          const taxableValue = round2(line.qty * line.rate);
          const tax = splitLineTax(taxableValue, line.taxPercent, supplierStateCode, placeOfSupplyStateCode);
          const lineTotal = taxableValue + lineTaxTotal(tax);
          return (
            <tr key={index}>
              <td>
                <ItemPicker items={items} value={line.itemId} onSelect={(item) => selectItem(index, item)} />
              </td>
              <td>
                <input
                  value={line.description}
                  onInput={(e) => updateLine(index, { description: (e.target as HTMLInputElement).value })}
                />
              </td>
              <td>
                <input
                  value={line.hsnSac}
                  onInput={(e) => updateLine(index, { hsnSac: (e.target as HTMLInputElement).value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={line.qty}
                  onInput={(e) => updateLine(index, { qty: Number((e.target as HTMLInputElement).value) })}
                />
              </td>
              <td>
                <input
                  value={line.unit}
                  onInput={(e) => updateLine(index, { unit: (e.target as HTMLInputElement).value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={line.rate}
                  onInput={(e) => updateLine(index, { rate: Number((e.target as HTMLInputElement).value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={line.taxPercent}
                  onInput={(e) =>
                    updateLine(index, { taxPercent: Number((e.target as HTMLInputElement).value) })
                  }
                />
              </td>
              <td class="num">{tax.cgst.toFixed(2)}</td>
              <td class="num">{tax.sgst.toFixed(2)}</td>
              <td class="num">{tax.igst.toFixed(2)}</td>
              <td class="num">{lineTotal.toFixed(2)}</td>
              <td>
                <button type="button" class="link-button" onClick={() => removeLine(index)}>
                  Remove
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={12}>
            <button type="button" onClick={addLine}>
              Add line
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
