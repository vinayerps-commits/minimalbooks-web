/**
 * MinimalBooks
 * ui/store.ts
 *
 * App-wide signals: the signed-in user and their one company (MVP scope --
 * see supabase/migrations/0001_companies.sql's companies_one_per_owner).
 * Kept as plain module-level signals rather than a context provider since
 * there's exactly one of each for the whole app; components read them
 * directly via the signal's `.value`.
 */

import { signal } from "@preact/signals";
import type { AuthUser } from "../lib/auth";
import type { Company } from "../core/types";

export const currentUser = signal<AuthUser | null>(null);
export const currentCompany = signal<Company | null>(null);
/** True until the initial auth-state + company lookup has resolved once. */
export const bootstrapping = signal<boolean>(true);
