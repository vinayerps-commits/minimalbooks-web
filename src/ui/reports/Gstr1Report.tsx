/**
 * MinimalBooks
 * ui/reports/Gstr1Report.tsx
 *
 * GSTR-1 B2B/B2C summary, read from the gstr1_b2b_summary/gstr1_b2c_summary
 * views (supabase/migrations/0011_gst_reporting_views.sql), rendered
 * through DataTable for consistent sort/filter behavior with every other
 * list screen. Numbers here are meant for manual entry into the GST
 * portal, not a direct filing integration -- that's future scope.
 */

import { useEffect, useState } from "preact/hooks";
import { gstr1B2bSummary, gstr1B2cSummary, type Gstr1B2bRow, type Gstr1B2cRow } from "../../io/reports";
import { currentCompany } from "../store";
import { DataTable, type DataTableColumn } from "../widgets/DataTable";

const B2B_COLUMNS: DataTableColumn<Gstr1B2bRow>[] = [
  { key: "partyName", label: "Party", accessor: (r) => r.partyName, sortable: true, filter: "text" },
  { key: "partyGstin", label: "GSTIN", accessor: (r) => r.partyGstin, sortable: true },
  {
    key: "placeOfSupplyState",
    label: "Place of supply",
    accessor: (r) => r.placeOfSupplyState,
    render: (r) => `${r.placeOfSupplyState} (${r.placeOfSupplyStateCode})`,
    sortable: true,
    filter: "select",
  },
  { key: "invoiceCount", label: "Invoices", accessor: (r) => r.invoiceCount, sortable: true, align: "right" },
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
    key: "grandTotal",
    label: "Total",
    accessor: (r) => r.grandTotal,
    render: (r) => r.grandTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
];

const B2C_COLUMNS: DataTableColumn<Gstr1B2cRow>[] = [
  {
    key: "placeOfSupplyState",
    label: "Place of supply",
    accessor: (r) => r.placeOfSupplyState,
    render: (r) => `${r.placeOfSupplyState} (${r.placeOfSupplyStateCode})`,
    sortable: true,
    filter: "select",
  },
  { key: "invoiceCount", label: "Invoices", accessor: (r) => r.invoiceCount, sortable: true, align: "right" },
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
    key: "grandTotal",
    label: "Total",
    accessor: (r) => r.grandTotal,
    render: (r) => r.grandTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
];

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
      <DataTable
        columns={B2B_COLUMNS}
        rows={b2b}
        rowKey={(r) => r.partyId + r.placeOfSupplyStateCode}
        emptyMessage="No B2B invoices yet."
      />

      <h3>B2C (unregistered parties)</h3>
      <DataTable
        columns={B2C_COLUMNS}
        rows={b2c}
        rowKey={(r) => r.placeOfSupplyStateCode}
        emptyMessage="No B2C invoices yet."
      />
    </div>
  );
}
