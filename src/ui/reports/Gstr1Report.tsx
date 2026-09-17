/**
 * MinimalBooks
 * ui/reports/Gstr1Report.tsx
 *
 * GSTR-1 B2B/B2C summary, read from the gstr1_b2b_summary/gstr1_b2c_summary
 * views (supabase/migrations/0011_gst_reporting_views.sql). Numbers here
 * are meant for manual entry into the GST portal, not a direct filing
 * integration -- that's future scope.
 */

import { useEffect, useState } from "preact/hooks";
import { gstr1B2bSummary, gstr1B2cSummary, type Gstr1B2bRow, type Gstr1B2cRow } from "../../io/reports";
import { currentCompany } from "../store";

export function Gstr1Report() {
  const companyId = currentCompany.value!.id;
  const [b2b, setB2b] = useState<Gstr1B2bRow[]>([]);
  const [b2c, setB2c] = useState<Gstr1B2cRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [b2bResult, b2cResult] = await Promise.all([
        gstr1B2bSummary(companyId),
        gstr1B2cSummary(companyId),
      ]);
      setLoading(false);
      if (!b2bResult.ok) return setError(b2bResult.error);
      if (!b2cResult.ok) return setError(b2cResult.error);
      setB2b(b2bResult.value);
      setB2c(b2cResult.value);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div class="master-page">
      <h2>GSTR-1 Summary</h2>
      {error && <p class="error-text">{error}</p>}

      <h3>B2B (registered parties)</h3>
      <table class="master-table">
        <thead>
          <tr>
            <th>Party</th>
            <th>GSTIN</th>
            <th>Place of supply</th>
            <th>Invoices</th>
            <th>Taxable value</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {b2b.map((r) => (
            <tr key={r.partyId + r.placeOfSupplyStateCode}>
              <td>{r.partyName}</td>
              <td>{r.partyGstin}</td>
              <td>
                {r.placeOfSupplyState} ({r.placeOfSupplyStateCode})
              </td>
              <td class="num">{r.invoiceCount}</td>
              <td class="num">{r.taxableValue.toFixed(2)}</td>
              <td class="num">{r.cgstTotal.toFixed(2)}</td>
              <td class="num">{r.sgstTotal.toFixed(2)}</td>
              <td class="num">{r.igstTotal.toFixed(2)}</td>
              <td class="num">{r.grandTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>B2C (unregistered parties)</h3>
      <table class="master-table">
        <thead>
          <tr>
            <th>Place of supply</th>
            <th>Invoices</th>
            <th>Taxable value</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {b2c.map((r) => (
            <tr key={r.placeOfSupplyStateCode}>
              <td>
                {r.placeOfSupplyState} ({r.placeOfSupplyStateCode})
              </td>
              <td class="num">{r.invoiceCount}</td>
              <td class="num">{r.taxableValue.toFixed(2)}</td>
              <td class="num">{r.cgstTotal.toFixed(2)}</td>
              <td class="num">{r.sgstTotal.toFixed(2)}</td>
              <td class="num">{r.igstTotal.toFixed(2)}</td>
              <td class="num">{r.grandTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
