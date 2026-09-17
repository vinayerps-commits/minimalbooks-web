/**
 * MinimalBooks
 * ui/masters/ItemsPage.tsx
 *
 * Items master CRUD -- list, add, edit, delete. Fields mirror Mbooks'
 * app/ui/masters/items_master.py. This is the "framework-phase" item
 * master (enough for an ItemPicker in Phase 1's InvoiceForm); catalog
 * maturity (bulk import, categories, valuation) is Phase 5.
 */

import { useEffect, useState } from "preact/hooks";
import { createItem, deleteItem, listItems, updateItem, type ItemInput } from "../../io/items";
import { currentCompany } from "../store";
import type { Item, ItemType } from "../../core/types";

const BLANK: ItemInput = {
  code: "",
  name: "",
  hsnSac: "",
  unit: "Nos",
  saleRate: 0,
  purchaseRate: 0,
  taxPercent: 0,
  itemType: "goods",
  openingStock: 0,
  isActive: true,
};

const ITEM_TYPES: ItemType[] = ["goods", "raw_material", "service"];

export function ItemsPage() {
  const companyId = currentCompany.value!.id;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemInput>(BLANK);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    const result = await listItems(companyId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.value);
  }

  useEffect(() => {
    reload();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(BLANK);
    setShowForm(true);
  }

  function startEdit(it: Item) {
    setEditingId(it.id);
    setForm({
      code: it.code,
      name: it.name,
      hsnSac: it.hsnSac,
      unit: it.unit,
      saleRate: it.saleRate,
      purchaseRate: it.purchaseRate,
      taxPercent: it.taxPercent,
      itemType: it.itemType,
      openingStock: it.openingStock,
      isActive: it.isActive,
    });
    setShowForm(true);
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    const result = editingId ? await updateItem(editingId, form) : await createItem(companyId, form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    await reload();
  }

  async function remove(id: string) {
    setError(null);
    const result = await deleteItem(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await reload();
  }

  function textField(key: "code" | "name" | "hsnSac" | "unit") {
    return (e: Event) => setForm({ ...form, [key]: (e.target as HTMLInputElement).value });
  }

  function numberField(key: "saleRate" | "purchaseRate" | "taxPercent" | "openingStock") {
    return (e: Event) => setForm({ ...form, [key]: Number((e.target as HTMLInputElement).value) });
  }

  return (
    <div class="master-page">
      <div class="master-page-header">
        <h2>Items</h2>
        <button onClick={startAdd}>Add item</button>
      </div>
      {error && <p class="error-text">{error}</p>}
      {showForm && (
        <form class="master-form" onSubmit={submit}>
          <div class="field-row">
            <label>
              Code
              <input required value={form.code} onInput={textField("code")} />
            </label>
            <label>
              Name
              <input required value={form.name} onInput={textField("name")} />
            </label>
            <label>
              Type
              <select
                value={form.itemType}
                onChange={(e) =>
                  setForm({ ...form, itemType: (e.target as HTMLSelectElement).value as ItemType })
                }
              >
                {ITEM_TYPES.map((t) => (
                  <option value={t} key={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div class="field-row">
            <label>
              HSN/SAC
              <input value={form.hsnSac} onInput={textField("hsnSac")} />
            </label>
            <label>
              Unit
              <input value={form.unit} onInput={textField("unit")} />
            </label>
            <label>
              Tax %
              <input type="number" step="0.01" value={form.taxPercent} onInput={numberField("taxPercent")} />
            </label>
          </div>
          <div class="field-row">
            <label>
              Sale rate
              <input type="number" step="0.01" value={form.saleRate} onInput={numberField("saleRate")} />
            </label>
            <label>
              Purchase rate
              <input
                type="number"
                step="0.01"
                value={form.purchaseRate}
                onInput={numberField("purchaseRate")}
              />
            </label>
            <label>
              Opening stock
              <input
                type="number"
                step="0.01"
                value={form.openingStock}
                onInput={numberField("openingStock")}
              />
            </label>
          </div>
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
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>HSN/SAC</th>
              <th>Unit</th>
              <th>Sale rate</th>
              <th>Tax %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.code}</td>
                <td>{it.name}</td>
                <td>{it.itemType}</td>
                <td>{it.hsnSac}</td>
                <td>{it.unit}</td>
                <td>{it.saleRate}</td>
                <td>{it.taxPercent}</td>
                <td>
                  <button class="link-button" onClick={() => startEdit(it)}>
                    Edit
                  </button>
                  <button class="link-button" onClick={() => remove(it.id)}>
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
