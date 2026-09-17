/**
 * MinimalBooks
 * io/items.ts
 *
 * Data access for the `items` table (supabase/migrations/0004_items.sql).
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";
import type { Item } from "../core/types";

interface ItemRow {
  id: string;
  code: string;
  name: string;
  hsn_sac: string;
  unit: string;
  sale_rate: number;
  purchase_rate: number;
  tax_percent: number;
  item_type: Item["itemType"];
  opening_stock: number;
  is_active: boolean;
}

const COLUMNS =
  "id, code, name, hsn_sac, unit, sale_rate, purchase_rate, tax_percent, item_type, opening_stock, is_active";

function fromRow(row: ItemRow): Item {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    hsnSac: row.hsn_sac,
    unit: row.unit,
    saleRate: row.sale_rate,
    purchaseRate: row.purchase_rate,
    taxPercent: row.tax_percent,
    itemType: row.item_type,
    openingStock: row.opening_stock,
    isActive: row.is_active,
  };
}

export async function listItems(companyId: string): Promise<Result<Item[]>> {
  const { data, error } = await getSupabaseClient()
    .from("items")
    .select(COLUMNS)
    .eq("company_id", companyId)
    .order("name");
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: (data as ItemRow[]).map(fromRow) };
}

export type ItemInput = Omit<Item, "id">;

export async function createItem(companyId: string, input: ItemInput): Promise<Result<Item>> {
  const { data, error } = await getSupabaseClient()
    .from("items")
    .insert({
      company_id: companyId,
      code: input.code,
      name: input.name,
      hsn_sac: input.hsnSac,
      unit: input.unit,
      sale_rate: input.saleRate,
      purchase_rate: input.purchaseRate,
      tax_percent: input.taxPercent,
      item_type: input.itemType,
      opening_stock: input.openingStock,
      is_active: input.isActive,
    })
    .select(COLUMNS)
    .single();
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as ItemRow) };
}

export async function updateItem(id: string, input: ItemInput): Promise<Result<Item>> {
  const { data, error } = await getSupabaseClient()
    .from("items")
    .update({
      code: input.code,
      name: input.name,
      hsn_sac: input.hsnSac,
      unit: input.unit,
      sale_rate: input.saleRate,
      purchase_rate: input.purchaseRate,
      tax_percent: input.taxPercent,
      item_type: input.itemType,
      opening_stock: input.openingStock,
      is_active: input.isActive,
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: fromRow(data as ItemRow) };
}

export async function deleteItem(id: string): Promise<Result<void>> {
  const { error } = await getSupabaseClient().from("items").delete().eq("id", id);
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: undefined };
}
