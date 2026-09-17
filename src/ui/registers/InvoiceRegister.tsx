/**
 * MinimalBooks
 * ui/registers/InvoiceRegister.tsx
 *
 * List of invoices, most recent first (io/vouchers.ts's listInvoices).
 * Clicking a row opens InvoiceDetail in place (no router in this app --
 * see ui/nav.ts -- so "open" is just local state, matching how Shell
 * swaps screens by nav entry).
 */

import { useEffect, useState } from "preact/hooks";
import { listInvoices, type InvoiceRegisterRow } from "../../io/vouchers";
import { currentCompany } from "../store";
import { InvoiceDetail } from "./InvoiceDetail";

export function InvoiceRegister() {
  const companyId = currentCompany.value!.id;
  const [rows, setRows] = useState<InvoiceRegisterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await listInvoices(companyId);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRows(result.value);
    })();
  }, []);

  if (openId) return <InvoiceDetail voucherId={openId} onBack={() => setOpenId(null)} />;

  if (loading) return <p>Loading...</p>;

  return (
    <div class="master-page">
      <h2>Invoice Register</h2>
      {error && <p class="error-text">{error}</p>}
      <table class="master-table">
        <thead>
          <tr>
            <th>Voucher no.</th>
            <th>Date</th>
            <th>Party</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Grand total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} class="clickable-row" onClick={() => setOpenId(r.id)}>
              <td>{r.voucherNo ?? "(draft)"}</td>
              <td>{r.voucherDate}</td>
              <td>{r.partyName}</td>
              <td>{r.status}</td>
              <td>{r.paymentStatus}</td>
              <td class="num">{r.grandTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
