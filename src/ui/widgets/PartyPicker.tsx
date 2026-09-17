/**
 * MinimalBooks
 * ui/widgets/PartyPicker.tsx
 *
 * A `<select>` over an already-loaded party list -- no search/autocomplete
 * yet (fine while a company has a handful of parties; revisit once that
 * stops being true).
 */

import type { Party } from "../../core/types";

export function PartyPicker({
  parties,
  value,
  onChange,
  placeholder = "Select a party",
}: {
  parties: Party[];
  value: string | null;
  onChange: (partyId: string | null) => void;
  placeholder?: string;
}) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange((e.target as HTMLSelectElement).value || null)}>
      <option value="">{placeholder}</option>
      {parties.map((p) => (
        <option value={p.id} key={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
