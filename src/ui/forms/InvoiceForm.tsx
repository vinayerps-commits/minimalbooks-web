/**
 * MinimalBooks
 * ui/forms/InvoiceForm.tsx
 *
 * Sales invoice entry -- header, line items (LineItemTable), live totals
 * preview (core/voucher.ts's computeVoucherTotals), and a single "Save &
 * Post" action that calls io/vouchers.ts's createAndPostInvoice (which
 * itself calls the create_draft_invoice + post_sales_invoice RPCs). No
 * draft-only save or edit screen yet -- Phase 1 scope is create-and-post;
 * see the plan for why editing a posted voucher needs reversal-based
 * amendment before it's safe to build.
 */

import { useEffect, useState } from "preact/hooks";
import { listParties } from "../../io/parties";
import { listItems } from "../../io/items";
import { createAndPostInvoice } from "../../io/vouchers";
import { currentCompany } from "../store";
import { computeVoucherTotals } from "../../core/voucher";
import { LineItemTable } from "../widgets/LineItemTable";
import { PartyPicker } from "../widgets/PartyPicker";
import type { Item, Party } from "../../core/types";
import type { VoucherLineInput } from "../../core/voucher";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceForm() {
  const company = currentCompany.value!;
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [voucherDate, setVoucherDate] = useState(today());
  const [partyId, setPartyId] = useState<string | null>(null);
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState(company.state);
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState(company.stateCode);
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<VoucherLineInput[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedVoucherNo, setSavedVoucherNo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [partiesResult, itemsResult] = await Promise.all([
        listParties(company.id),
        listItems(company.id),
      ]);
      setLoading(false);
      if (partiesResult.ok) setParties(partiesResult.value.filter((p) => p.isActive));
      else setError(partiesResult.error);
      if (itemsResult.ok) setItems(itemsResult.value.filter((i) => i.isActive));
      else setError(itemsResult.error);
    })();
  }, []);

  function selectParty(id: string | null) {
    setPartyId(id);
    // Default place of supply to the party's own state when it has one --
    // the user can still override it (e.g. bill-to vs. ship-to differ).
    const party = parties.find((p) => p.id === id);
    if (party?.state) {
      setPlaceOfSupplyState(party.state);
      setPlaceOfSupplyStateCode(party.stateCode);
    }
  }

  const totals = computeVoucherTotals(lines, company.stateCode, placeOfSupplyStateCode);

  function resetForm() {
    setVoucherDate(today());
    setPartyId(null);
    setPlaceOfSupplyState(company.state);
    setPlaceOfSupplyStateCode(company.stateCode);
    setReferenceNo("");
    setNotes("");
    setLines([]);
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);

    if (!partyId) {
      setError("Select a party.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one line.");
      return;
    }

    setSaving(true);
    const result = await createAndPostInvoice({
      companyId: company.id,
      voucherDate,
      dueDate: null,
      partyId,
      shipToPartyId: null,
      placeOfSupplyState,
      placeOfSupplyStateCode,
      referenceNo,
      subjectRef: "",
      notes,
      lines,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedVoucherNo(result.value.voucherNo);
    resetForm();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div class="voucher-form">
      <h2>Invoice</h2>
      {savedVoucherNo && <p class="success-text">Posted invoice {savedVoucherNo}.</p>}
      {error && <p class="error-text">{error}</p>}
      <form onSubmit={submit}>
        <div class="field-row">
          <label>
            Date
            <input
              type="date"
              required
              value={voucherDate}
              onInput={(e) => setVoucherDate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            Party
            <PartyPicker parties={parties} value={partyId} onChange={selectParty} />
          </label>
          <label>
            Reference no.
            <input
              value={referenceNo}
              onInput={(e) => setReferenceNo((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <div class="field-row">
          <label>
            Place of supply (state)
            <input
              value={placeOfSupplyState}
              onInput={(e) => setPlaceOfSupplyState((e.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            Place of supply (state code)
            <input
              value={placeOfSupplyStateCode}
              onInput={(e) => setPlaceOfSupplyStateCode((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <LineItemTable
          items={items}
          lines={lines}
          supplierStateCode={company.stateCode}
          placeOfSupplyStateCode={placeOfSupplyStateCode}
          onChange={setLines}
        />

        <div class="voucher-totals">
          <div>
            Subtotal <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          <div>
            CGST <span>{totals.cgstTotal.toFixed(2)}</span>
          </div>
          <div>
            SGST <span>{totals.sgstTotal.toFixed(2)}</span>
          </div>
          <div>
            IGST <span>{totals.igstTotal.toFixed(2)}</span>
          </div>
          <div>
            Rounding <span>{totals.rounding.toFixed(2)}</span>
          </div>
          <div class="voucher-grand-total">
            Grand total <span>{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <label>
          Notes
          <textarea value={notes} onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)} />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save & Post"}
        </button>
      </form>
    </div>
  );
}
