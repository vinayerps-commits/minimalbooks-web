/**
 * MinimalBooks
 * ui/CompanySetup.tsx
 *
 * First-run "create your company" flow -- shown whenever the signed-in
 * user has no company yet (currentCompany.value === null). Creates the
 * company, then immediately seeds the default chart of accounts
 * (core/defaultChartOfAccounts.ts) so every later screen can assume the
 * standard accounts already exist.
 */

import { useState } from "preact/hooks";
import { createCompany, type NewCompanyInput } from "../io/companies";
import { seedDefaults } from "../io/chartOfAccounts";
import { currentCompany } from "./store";

const BLANK: NewCompanyInput = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  stateCode: "",
  pincode: "",
  gstin: "",
  email: "",
  phone: "",
};

export function CompanySetup() {
  const [form, setForm] = useState<NewCompanyInput>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function field(key: keyof NewCompanyInput) {
    return (e: Event) => setForm({ ...form, [key]: (e.target as HTMLInputElement).value });
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const created = await createCompany(form);
    if (!created.ok) {
      setBusy(false);
      setError(created.error);
      return;
    }

    const seeded = await seedDefaults(created.value.id);
    setBusy(false);
    if (!seeded.ok) {
      // Company exists but without its chart of accounts -- surface the
      // error rather than silently proceeding into a screen that assumes
      // accounts like "Sundry Debtors" already exist.
      setError(`Company created, but seeding the chart of accounts failed: ${seeded.error}`);
      return;
    }

    currentCompany.value = created.value;
  }

  return (
    <div class="company-setup">
      <h1>Set up your company</h1>
      <form onSubmit={submit}>
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
            <input value={form.stateCode} onInput={field("stateCode")} placeholder="e.g. 27" />
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
        <button type="submit" disabled={busy}>
          Create company
        </button>
      </form>
    </div>
  );
}
