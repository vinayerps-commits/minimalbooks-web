/**
 * MinimalBooks
 * ui/registers/InvoiceRegister.tsx
 *
 * List of invoices (io/vouchers.ts's listInvoices, pre-sorted most-recent-
 * first) rendered through DataTable -- sortable by voucher no./date/
 * total, text-filterable by party, dropdown-filterable by status and
 * payment status. Clicking a row opens InvoiceDetail in place (no router
 * in this app -- see ui/nav.ts -- so "open" is just local state, matching
 * how Shell swaps screens by nav entry).
 */

import { useEffect, useState } from "preact/hooks";
import { listInvoices, type InvoiceRegisterRow } from "../../io/vouchers";
import { currentCompany } from "../store";
import { InvoiceDetail } from "./InvoiceDetail";
import { DataTable, type DataTableColumn } from "../widgets/DataTable";

const COLUMNS: DataTableColumn<InvoiceRegisterRow>[] = [
  { key: "voucherNo", label: "Voucher no.", accessor: (r) => r.voucherNo ?? "(draft)", sortable: true },
  { key: "voucherDate", label: "Date", accessor: (r) => r.voucherDate, sortable: true },
  { key: "partyName", label: "Party", accessor: (r) => r.partyName, sortable: true, filter: "text" },
  { key: "status", label: "Status", accessor: (r) => r.status, sortable: true, filter: "select" },
  {
    key: "paymentStatus",
    label: "Payment",
    accessor: (r) => r.paymentStatus,
    sortable: true,
    filter: "select",
  },
  {
    key: "grandTotal",
    label: "Grand total",
    accessor: (r) => r.grandTotal,
    render: (r) => r.grandTotal.toFixed(2),
    sortable: true,
    align: "right",
  },
];

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
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => setOpenId(r.id)}
        emptyMessage="No invoices yet."
      />
    </div>
  );
}
