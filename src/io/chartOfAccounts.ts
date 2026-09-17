/**
 * MinimalBooks
 * io/chartOfAccounts.ts
 *
 * Data access for the `chart_of_accounts` table
 * (supabase/migrations/0002_chart_of_accounts.sql).
 */

import { getSupabaseClient } from "../lib/supabaseClient";
import { describeError, type Result } from "./result";
import { DEFAULT_CHART_OF_ACCOUNTS } from "../core/defaultChartOfAccounts";
import type { Account } from "../core/types";

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: Account["type"];
  is_group: boolean;
}

function fromRow(row: AccountRow): Account {
  return { id: row.id, code: row.code, name: row.name, type: row.type, isGroup: row.is_group };
}

export async function listAccounts(companyId: string): Promise<Result<Account[]>> {
  const { data, error } = await getSupabaseClient()
    .from("chart_of_accounts")
    .select("id, code, name, type, is_group")
    .eq("company_id", companyId)
    .order("code");
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: (data as AccountRow[]).map(fromRow) };
}

/** Inserts the starter chart of accounts (see core/defaultChartOfAccounts.ts)
 *  for a newly created company. Called once, right after createCompany() --
 *  not from a migration, since seeding happens per-company, not per-database. */
export async function seedDefaults(companyId: string): Promise<Result<void>> {
  const { error } = await getSupabaseClient()
    .from("chart_of_accounts")
    .insert(
      DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
        company_id: companyId,
        code: a.code,
        name: a.name,
        type: a.type,
        is_group: a.isGroup,
      })),
    );
  if (error) return { ok: false, error: describeError(error) };
  return { ok: true, value: undefined };
}
