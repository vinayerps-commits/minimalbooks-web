/**
 * MinimalBooks
 * io/companies.ts
 *
 * Data access for the `companies` table (supabase/migrations/0001_companies.sql).
 * MVP is one company per signed-in user -- getMyCompany() returns it or null
 * (first-run: no company yet), createCompany() makes the only one this
 * account will have until multi-company ships.
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";
import type { Company } from "../core/types";

interface CompanyRow {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  gstin: string;
  msme: string;
  email: string;
  phone: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  bank_branch: string;
}

function fromRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    stateCode: row.state_code,
    pincode: row.pincode,
    gstin: row.gstin,
    msme: row.msme,
    email: row.email,
    phone: row.phone,
    bankName: row.bank_name,
    bankAccount: row.bank_account,
    bankIfsc: row.bank_ifsc,
    bankBranch: row.bank_branch,
  };
}

const COLUMNS =
  "id, name, address_line1, address_line2, city, state, state_code, pincode, gstin, msme, email, phone, bank_name, bank_account, bank_ifsc, bank_branch";

/** Returns the signed-in user's company, or null if they haven't created
 *  one yet (drives the first-run "create your company" flow). RLS's own
 *  "select own company" policy is what scopes this -- companies_one_per_owner
 *  guarantees at most one row. */
export async function getMyCompany(): Promise<Result<Company | null>> {
  const { data, error } = await getSupabaseClient().from("companies").select(COLUMNS).maybeSingle();
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: data ? fromRow(data as CompanyRow) : null };
}

export interface NewCompanyInput {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  email: string;
  phone: string;
}

/** Creates the account's one company -- owner_id is left unset so the
 *  column's own `default auth.uid()` fills it in server-side, never trusted
 *  from the client. Caller (ui/CompanySetup) follows this with
 *  chartOfAccounts.seedDefaults(companyId). */
export async function createCompany(input: NewCompanyInput): Promise<Result<Company>> {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .insert({
      name: input.name,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state: input.state,
      state_code: input.stateCode,
      pincode: input.pincode,
      gstin: input.gstin,
      email: input.email,
      phone: input.phone,
    })
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as CompanyRow) };
}

export async function updateCompany(id: string, input: NewCompanyInput): Promise<Result<Company>> {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .update({
      name: input.name,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state: input.state,
      state_code: input.stateCode,
      pincode: input.pincode,
      gstin: input.gstin,
      email: input.email,
      phone: input.phone,
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as CompanyRow) };
}
