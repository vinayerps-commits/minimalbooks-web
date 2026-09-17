/**
 * MinimalBooks
 * ui/reports/HsnSummaryReport.tsx
 *
 * HSN/SAC-wise summary, read from the hsn_summary view.
 */

import { useEffect, useState } from "preact/hooks";
import { hsnSummary, type HsnSummaryRow } from "../../io/reports";
import { currentCompany } from "../store";

export function HsnSummaryReport() {
  const companyId = currentCompany.value!.id;
  const [rows, setRows] = useState<HsnSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await hsnSummary(companyId);
      setLoading(false);
      if (!result.ok) return setError(result.error);
      setRows(result.value);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div class="master-page">
      <h2>HSN Summary</h2>
      {error && <p class="error-text">{error}</p>}
      <table class="master-table">
        <thead>
          <tr>
            <th>HSN/SAC</th>
            <th>Tax %</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Taxable value</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
            <th>Total value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hsnSac + r.taxPercent}>
              <td>{r.hsnSac}</td>
              <td class="num">{r.taxPercent}</td>
              <td>{r.unit}</td>
              <td class="num">{r.totalQty}</td>
              <td class="num">{r.taxableValue.toFixed(2)}</td>
              <td class="num">{r.cgstTotal.toFixed(2)}</td>
              <td class="num">{r.sgstTotal.toFixed(2)}</td>
              <td class="num">{r.igstTotal.toFixed(2)}</td>
              <td class="num">{r.totalValue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
