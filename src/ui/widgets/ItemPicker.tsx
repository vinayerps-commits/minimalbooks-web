/**
 * MinimalBooks
 * ui/widgets/ItemPicker.tsx
 *
 * A `<select>` over an already-loaded item list. onSelect hands back the
 * full Item (not just its id) so a line-item row can auto-fill
 * description/HSN/unit/rate/tax% from the item master, matching what
 * Mbooks' item_picker.py did.
 */

import type { Item } from "../../core/types";

export function ItemPicker({
  items,
  value,
  onSelect,
}: {
  items: Item[];
  value: string | null;
  onSelect: (item: Item | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const id = (e.target as HTMLSelectElement).value;
        onSelect(items.find((i) => i.id === id) ?? null);
      }}
    >
      <option value="">Select an item</option>
      {items.map((i) => (
        <option value={i.id} key={i.id}>
          {i.code} — {i.name}
        </option>
      ))}
    </select>
  );
}
