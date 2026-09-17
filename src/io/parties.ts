/**
 * MinimalBooks
 * io/parties.ts
 *
 * Data access for the `parties` table (supabase/migrations/0003_parties.sql)
 * -- customers/vendors. Every call is scoped to a company_id the caller
 * passes explicitly (unlike drawings' pure owner_id scoping in
 * minimalcadWEB, this app needs the extra company_id filter since a user
 * could in principle own more than one company once multi-company ships);
 * RLS's own owns_company() check is still the real access boundary.
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";
import type { Party } from "../core/types";

interface PartyRow {
  id: string;
  name: string;
  party_type: Party["partyType"];
  billing_address: string;
  shipping_address: string;
  state: string;
  state_code: string;
  gstin: string;
  gst_registration_type: Party["gstRegistrationType"];
  phone: string;
  email: string;
  is_active: boolean;
}

const COLUMNS =
  "id, name, party_type, billing_address, shipping_address, state, state_code, gstin, gst_registration_type, phone, email, is_active";

function fromRow(row: PartyRow): Party {
  return {
    id: row.id,
    name: row.name,
    partyType: row.party_type,
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    state: row.state,
    stateCode: row.state_code,
    gstin: row.gstin,
    gstRegistrationType: row.gst_registration_type,
    phone: row.phone,
    email: row.email,
    isActive: row.is_active,
  };
}

export async function listParties(companyId: string): Promise<Result<Party[]>> {
  const { data, error } = await getSupabaseClient()
    .from("parties")
    .select(COLUMNS)
    .eq("company_id", companyId)
    .order("name");
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: (data as PartyRow[]).map(fromRow) };
}

export type PartyInput = Omit<Party, "id">;

export async function createParty(companyId: string, input: PartyInput): Promise<Result<Party>> {
  const { data, error } = await getSupabaseClient()
    .from("parties")
    .insert({
      company_id: companyId,
      name: input.name,
      party_type: input.partyType,
      billing_address: input.billingAddress,
      shipping_address: input.shippingAddress,
      state: input.state,
      state_code: input.stateCode,
      gstin: input.gstin,
      gst_registration_type: input.gstRegistrationType,
      phone: input.phone,
      email: input.email,
      is_active: input.isActive,
    })
    .select(COLUMNS)
    .single();
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as PartyRow) };
}

export async function updateParty(id: string, input: PartyInput): Promise<Result<Party>> {
  const { data, error } = await getSupabaseClient()
    .from("parties")
    .update({
      name: input.name,
      party_type: input.partyType,
      billing_address: input.billingAddress,
      shipping_address: input.shippingAddress,
      state: input.state,
      state_code: input.stateCode,
      gstin: input.gstin,
      gst_registration_type: input.gstRegistrationType,
      phone: input.phone,
      email: input.email,
      is_active: input.isActive,
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as PartyRow) };
}

export async function deleteParty(id: string): Promise<Result<void>> {
  const { error } = await getSupabaseClient().from("parties").delete().eq("id", id);
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: undefined };
}
