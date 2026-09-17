/**
 * MinimalBooks
 * ui/registers/InvoiceDetail.tsx
 *
 * Read-only view of one invoice + its lines (io/vouchers.ts's getInvoice).
 * Opened from InvoiceRegister by clicking a row. No print/PDF export yet
 * (Mbooks' pdf/invoice_pdf.py is the content-shape reference for that,
 * still future scope) and no edit action -- see InvoiceForm's header
 * comment on why editing a posted voucher needs reversal-based amendment
 * before it's safe to build.
 */

import { useEffect, useState } from "preact/hooks";
import { getInvoice } from "../../io/vouchers";
import type { Voucher, VoucherLine } from "../../core/voucher";

export function InvoiceDetail({ voucherId, onBack }: { voucherId: string; onBack: () => void }) {
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [partyName, setPartyName] = useState<string | null>(null);
  const [lines, setLines] = useState<VoucherLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getInvoice(voucherId);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVoucher(result.value.voucher);
      setPartyName(result.value.partyName);
      setLines(result.value.lines);
    })();
  }, [voucherId]);

  return (
    <div class="master-page">
      <div class="master-page-header">
        <h2>Invoice</h2>
        <button class="link-button" onClick={onBack}>
          Back to register
        </button>
      </div>
      {error && <p class="error-text">{error}</p>}
      {loading || !voucher ? (
        <p>Loading...</p>
      ) : (
        <>
          <div class="field-row">
            <div>
              <strong>Voucher no.</strong> {voucher.voucherNo ?? "(draft)"}
            </div>
            <div>
              <strong>Date</strong> {voucher.voucherDate}
            </div>
            <div>
              <strong>Party</strong> {partyName}
            </div>
            <div>
              <strong>Status</strong> {voucher.status}
            </div>
          </div>
          <div class="field-row">
            <div>
              <strong>Place of supply</strong> {voucher.placeOfSupplyState} ({voucher.placeOfSupplyStateCode})
            </div>
            <div>
              <strong>Reference no.</strong> {voucher.referenceNo || "—"}
            </div>
            <div>
              <strong>Payment</strong> {voucher.paymentStatus}
            </div>
          </div>

          <table class="master-table">
            <thead>
              <tr>
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
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.description}</td>
                  <td>{l.hsnSac}</td>
                  <td class="num">{l.qty}</td>
                  <td>{l.unit}</td>
                  <td class="num">{l.rate.toFixed(2)}</td>
                  <td class="num">{l.taxPercent}</td>
                  <td class="num">{l.cgstAmt.toFixed(2)}</td>
                  <td class="num">{l.sgstAmt.toFixed(2)}</td>
                  <td class="num">{l.igstAmt.toFixed(2)}</td>
                  <td class="num">{l.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div class="voucher-totals">
            <div>
              Subtotal <span>{voucher.subtotal.toFixed(2)}</span>
            </div>
            <div>
              CGST <span>{voucher.cgstTotal.toFixed(2)}</span>
            </div>
            <div>
              SGST <span>{voucher.sgstTotal.toFixed(2)}</span>
            </div>
            <div>
              IGST <span>{voucher.igstTotal.toFixed(2)}</span>
            </div>
            <div>
              Rounding <span>{voucher.rounding.toFixed(2)}</span>
            </div>
            <div class="voucher-grand-total">
              Grand total <span>{voucher.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {voucher.notes && (
            <p>
              <strong>Notes:</strong> {voucher.notes}
            </p>
          )}
        </>
      )}
    </div>
  );
}
