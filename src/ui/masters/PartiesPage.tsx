/**
 * MinimalBooks
 * ui/masters/PartiesPage.tsx
 *
 * Customers/vendors master CRUD -- list, add, edit, delete. Fields mirror
 * Mbooks' app/ui/masters/parties_master.py.
 */

import { useEffect, useState } from "preact/hooks";
import { createParty, deleteParty, listParties, updateParty, type PartyInput } from "../../io/parties";
import { currentCompany } from "../store";
import { DataTable, type DataTableColumn } from "../widgets/DataTable";
import type { GstRegistrationType, Party, PartyType } from "../../core/types";

const BLANK: PartyInput = {
  name: "",
  partyType: "customer",
  billingAddress: "",
  shippingAddress: "",
  state: "",
  stateCode: "",
  gstin: "",
  gstRegistrationType: "unregistered",
  phone: "",
  email: "",
  isActive: true,
};

const PARTY_TYPES: PartyType[] = ["customer", "vendor", "both"];
const GST_TYPES: GstRegistrationType[] = [
  "registered",
  "unregistered",
  "composition",
  "overseas",
  "consumer",
];

export function PartiesPage() {
  const companyId = currentCompany.value!.id;
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartyInput>(BLANK);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    const result = await listParties(companyId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setParties(result.value);
  }

  useEffect(() => {
    reload();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(BLANK);
    setShowForm(true);
  }

  function startEdit(p: Party) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      partyType: p.partyType,
      billingAddress: p.billingAddress,
      shippingAddress: p.shippingAddress,
      state: p.state,
      stateCode: p.stateCode,
      gstin: p.gstin,
      gstRegistrationType: p.gstRegistrationType,
      phone: p.phone,
      email: p.email,
      isActive: p.isActive,
    });
    setShowForm(true);
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    const result = editingId ? await updateParty(editingId, form) : await createParty(companyId, form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    await reload();
  }

  async function remove(id: string) {
    setError(null);
    const result = await deleteParty(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await reload();
  }

  function field(key: keyof PartyInput) {
    return (e: Event) => setForm({ ...form, [key]: (e.target as HTMLInputElement).value });
  }

  const columns: DataTableColumn<Party>[] = [
    { key: "name", label: "Name", accessor: (p) => p.name, sortable: true, filter: "text" },
    { key: "partyType", label: "Type", accessor: (p) => p.partyType, sortable: true, filter: "select" },
    { key: "state", label: "State", accessor: (p) => p.state, sortable: true, filter: "select" },
    { key: "gstin", label: "GSTIN", accessor: (p) => p.gstin, sortable: true },
    {
      key: "gstRegistrationType",
      label: "GST reg.",
      accessor: (p) => p.gstRegistrationType,
      sortable: true,
      filter: "select",
    },
    { key: "phone", label: "Phone", accessor: (p) => p.phone },
    {
      key: "actions",
      label: "",
      accessor: () => "",
      render: (p) => (
        <>
          <button class="link-button" onClick={() => startEdit(p)}>
            Edit
          </button>
          <button class="link-button" onClick={() => remove(p.id)}>
            Delete
          </button>
        </>
      ),
    },
  ];

  return (
    <div class="master-page">
      <div class="master-page-header">
        <h2>Customers / Vendors</h2>
        <button onClick={startAdd}>Add party</button>
      </div>
      {error && <p class="error-text">{error}</p>}
      {showForm && (
        <form class="master-form" onSubmit={submit}>
          <div class="field-row">
            <label>
              Name
              <input required value={form.name} onInput={field("name")} />
            </label>
            <label>
              Type
              <select
                value={form.partyType}
                onChange={(e) =>
                  setForm({ ...form, partyType: (e.target as HTMLSelectElement).value as PartyType })
                }
              >
                {PARTY_TYPES.map((t) => (
                  <option value={t} key={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div class="field-row">
            <label>
              State
              <input value={form.state} onInput={field("state")} />
            </label>
            <label>
              State code
              <input value={form.stateCode} onInput={field("stateCode")} />
            </label>
            <label>
              GSTIN
              <input value={form.gstin} onInput={field("gstin")} />
            </label>
            <label>
              GST registration
              <select
                value={form.gstRegistrationType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gstRegistrationType: (e.target as HTMLSelectElement).value as GstRegistrationType,
                  })
                }
              >
                {GST_TYPES.map((t) => (
                  <option value={t} key={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div class="field-row">
            <label>
              Phone
              <input value={form.phone} onInput={field("phone")} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onInput={field("email")} />
            </label>
          </div>
          <label>
            Billing address
            <textarea
              value={form.billingAddress}
              onInput={(e) => setForm({ ...form, billingAddress: (e.target as HTMLTextAreaElement).value })}
            />
          </label>
          <div class="master-form-actions">
            <button type="submit">{editingId ? "Save" : "Add"}</button>
            <button type="button" class="link-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} rows={parties} rowKey={(p) => p.id} emptyMessage="No parties yet." />
      )}
    </div>
  );
}
