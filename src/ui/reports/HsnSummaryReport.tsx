/**
 * MinimalBooks
 * ui/reports/HsnSummaryReport.tsx
 *
 * HSN/SAC-wise summary, read from the hsn_summary view.
 */

import { useEffect, useState } from "preact/hooks";
import { hsnSummary, type HsnSummaryRow } from "../../io/reports";
import { currentCompany } from "../store";
import { DataTable, type DataTableColumn } from "../widgets/DataTable";

const COLUMNS: DataTableColumn<HsnSummaryRow>[] = [
  { key: "hsnSac", label: "HSN/SAC", accessor: (r) => r.hsnSac, sortable: true, filter: "text" },
  {
    key: "taxPercent",
    label: "Tax %",
    accessor: (r) => r.taxPercent,
    sortable: true,
    filter: "select",
    align: "right",
  },
  { key: "unit", label: "Unit", accessor: (r) => r.unit, sortable: true, filter: "select" },
  { key: "totalQty", label: "Qty", accessor: (r) => r.totalQty, sortable: true, align: "right" },
  {
    key: "taxableValue",
    label: "Taxable value",
    accessor: (r) => r.taxableValue,
    render: (r) => r.taxableValue.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "cgstTotal",
    label: "CGST",
    accessor: (r) => r.cgstTotal,
    render: (r) => r.cgstTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "sgstTotal",
    label: "SGST",
    accessor: (r) => r.sgstTotal,
    render: (r) => r.sgstTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "igstTotal",
    label: "IGST",
    accessor: (r) => r.igstTotal,
    render: (r) => r.igstTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
  {
    key: "totalValue",
    label: "Total value",
    accessor: (r) => r.totalValue,
    render: (r) => r.totalValue.toFixed(2),
    sortable: true,
    align: "right",
  },
];

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
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.hsnSac + r.taxPercent}
        emptyMessage="No posted invoices yet."
      />
    </div>
  );
}
