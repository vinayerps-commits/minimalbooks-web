/**
 * MinimalBooks
 * ui/reports/Gstr3bReport.tsx
 *
 * GSTR-3B summary, read from the gstr3b_summary view. ITC columns are
 * always 0 for now -- there are no purchase bills yet (Phase 2) -- shown
 * explicitly as "pending purchase bills" rather than a real zero figure.
 */

import { useEffect, useState } from "preact/hooks";
import { gstr3bSummary, type Gstr3bRow } from "../../io/reports";
import { currentCompany } from "../store";

export function Gstr3bReport() {
  const companyId = currentCompany.value!.id;
  const [rows, setRows] = useState<Gstr3bRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await gstr3bSummary(companyId);
      setLoading(false);
      if (!result.ok) return setError(result.error);
      setRows(result.value);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div class="master-page">
      <h2>GSTR-3B Summary</h2>
      <p class="hint-text">
        ITC is pending purchase bills (not built yet) -- treat those columns as 0, not final.
      </p>
      {error && <p class="error-text">{error}</p>}
      <table class="master-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Outward taxable value</th>
            <th>Outward CGST</th>
            <th>Outward SGST</th>
            <th>Outward IGST</th>
            <th>ITC CGST</th>
            <th>ITC SGST</th>
            <th>ITC IGST</th>
            <th>Net CGST payable</th>
            <th>Net SGST payable</th>
            <th>Net IGST payable</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period}>
              <td>{r.period}</td>
              <td class="num">{r.outwardTaxableValue.toFixed(2)}</td>
              <td class="num">{r.outwardCgst.toFixed(2)}</td>
              <td class="num">{r.outwardSgst.toFixed(2)}</td>
              <td class="num">{r.outwardIgst.toFixed(2)}</td>
              <td class="num">{r.itcCgst.toFixed(2)}</td>
              <td class="num">{r.itcSgst.toFixed(2)}</td>
              <td class="num">{r.itcIgst.toFixed(2)}</td>
              <td class="num">{r.netCgstPayable.toFixed(2)}</td>
              <td class="num">{r.netSgstPayable.toFixed(2)}</td>
              <td class="num">{r.netIgstPayable.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
