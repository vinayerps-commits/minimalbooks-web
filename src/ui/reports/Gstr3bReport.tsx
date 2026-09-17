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
import { DataTable, type DataTableColumn } from "../widgets/DataTable";

const COLUMNS: DataTableColumn<Gstr3bRow>[] = [
  { key: "period", label: "Period", accessor: (r) => r.period, sortable: true, filter: "select" },
  {
    key: "outwardTaxableValue",
    label: "Outward taxable value",
    accessor: (r) => r.outwardTaxableValue,
    render: (r) => r.outwardTaxableValue.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "outwardCgst",
    label: "Outward CGST",
    accessor: (r) => r.outwardCgst,
    render: (r) => r.outwardCgst.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "outwardSgst",
    label: "Outward SGST",
    accessor: (r) => r.outwardSgst,
    render: (r) => r.outwardSgst.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "outwardIgst",
    label: "Outward IGST",
    accessor: (r) => r.outwardIgst,
    render: (r) => r.outwardIgst.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "itcCgst",
    label: "ITC CGST",
    accessor: (r) => r.itcCgst,
    render: (r) => r.itcCgst.toFixed(2),
    align: "right",
  },
  {
    key: "itcSgst",
    label: "ITC SGST",
    accessor: (r) => r.itcSgst,
    render: (r) => r.itcSgst.toFixed(2),
    align: "right",
  },
  {
    key: "itcIgst",
    label: "ITC IGST",
    accessor: (r) => r.itcIgst,
    render: (r) => r.itcIgst.toFixed(2),
    align: "right",
  },
  {
    key: "netCgstPayable",
    label: "Net CGST payable",
    accessor: (r) => r.netCgstPayable,
    render: (r) => r.netCgstPayable.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "netSgstPayable",
    label: "Net SGST payable",
    accessor: (r) => r.netSgstPayable,
    render: (r) => r.netSgstPayable.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "netIgstPayable",
    label: "Net IGST payable",
    accessor: (r) => r.netIgstPayable,
    render: (r) => r.netIgstPayable.toFixed(2),
    sortable: true,
    align: "right",
  },
];

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
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.period}
        emptyMessage="No posted invoices yet."
      />
    </div>
  );
}
