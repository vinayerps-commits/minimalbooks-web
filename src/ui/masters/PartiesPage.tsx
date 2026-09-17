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
        <table class="master-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>State</th>
              <th>GSTIN</th>
              <th>GST reg.</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parties.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.partyType}</td>
                <td>{p.state}</td>
                <td>{p.gstin}</td>
                <td>{p.gstRegistrationType}</td>
                <td>{p.phone}</td>
                <td>
                  <button class="link-button" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button class="link-button" onClick={() => remove(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
