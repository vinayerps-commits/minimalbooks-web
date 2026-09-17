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
import { DataTable, type DataTableColumn } from "../widgets/DataTable";
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

  const columns: DataTableColumn<Item>[] = [
    { key: "code", label: "Code", accessor: (i) => i.code, sortable: true, filter: "text" },
    { key: "name", label: "Name", accessor: (i) => i.name, sortable: true, filter: "text" },
    { key: "itemType", label: "Type", accessor: (i) => i.itemType, sortable: true, filter: "select" },
    { key: "hsnSac", label: "HSN/SAC", accessor: (i) => i.hsnSac, sortable: true },
    { key: "unit", label: "Unit", accessor: (i) => i.unit, sortable: true, filter: "select" },
    {
      key: "saleRate",
      label: "Sale rate",
      accessor: (i) => i.saleRate,
      render: (i) => i.saleRate.toFixed(2),
      sortable: true,
      align: "right",
    },
    {
      key: "taxPercent",
      label: "Tax %",
      accessor: (i) => i.taxPercent,
      sortable: true,
      filter: "select",
      align: "right",
    },
    {
      key: "actions",
      label: "",
      accessor: () => "",
      render: (i) => (
        <>
          <button class="link-button" onClick={() => startEdit(i)}>
            Edit
          </button>
          <button class="link-button" onClick={() => remove(i.id)}>
            Delete
          </button>
        </>
      ),
    },
  ];

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
        <DataTable columns={columns} rows={items} rowKey={(i) => i.id} emptyMessage="No items yet." />
      )}
    </div>
  );
}
