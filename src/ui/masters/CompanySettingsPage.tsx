/**
 * MinimalBooks
 * ui/masters/CompanySettingsPage.tsx
 *
 * Edit the current company's details (updateCompany in io/companies.ts).
 * Bank fields aren't editable here yet -- they're wired up when Phase 5's
 * bank-ledger payment/receipt books need them.
 */

import { useState } from "preact/hooks";
import { updateCompany, type NewCompanyInput } from "../../io/companies";
import { currentCompany } from "../store";

export function CompanySettingsPage() {
  const company = currentCompany.value!;
  const [form, setForm] = useState<NewCompanyInput>({
    name: company.name,
    addressLine1: company.addressLine1,
    addressLine2: company.addressLine2,
    city: company.city,
    state: company.state,
    stateCode: company.stateCode,
    pincode: company.pincode,
    gstin: company.gstin,
    email: company.email,
    phone: company.phone,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function field(key: keyof NewCompanyInput) {
    return (e: Event) => {
      setSaved(false);
      setForm({ ...form, [key]: (e.target as HTMLInputElement).value });
    };
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    const result = await updateCompany(company.id, form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    currentCompany.value = result.value;
    setSaved(true);
  }

  return (
    <div class="master-page">
      <h2>Company Settings</h2>
      <form class="master-form" onSubmit={submit}>
        <label>
          Company name
          <input required value={form.name} onInput={field("name")} />
        </label>
        <label>
          Address line 1
          <input value={form.addressLine1} onInput={field("addressLine1")} />
        </label>
        <label>
          Address line 2
          <input value={form.addressLine2} onInput={field("addressLine2")} />
        </label>
        <div class="field-row">
          <label>
            City
            <input value={form.city} onInput={field("city")} />
          </label>
          <label>
            State
            <input value={form.state} onInput={field("state")} />
          </label>
          <label>
            State code
            <input value={form.stateCode} onInput={field("stateCode")} />
          </label>
          <label>
            Pincode
            <input value={form.pincode} onInput={field("pincode")} />
          </label>
        </div>
        <div class="field-row">
          <label>
            GSTIN
            <input value={form.gstin} onInput={field("gstin")} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onInput={field("email")} />
          </label>
          <label>
            Phone
            <input value={form.phone} onInput={field("phone")} />
          </label>
        </div>
        {error && <p class="error-text">{error}</p>}
        {saved && <p class="success-text">Saved.</p>}
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
