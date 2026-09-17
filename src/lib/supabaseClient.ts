/**
 * MinimalBooks
 * lib/supabaseClient.ts
 *
 * Singleton Supabase client for company/ledger data + auth. Configured
 * entirely from Vite env vars (VITE_-prefixed ones are the only ones Vite
 * inlines into the built bundle) -- there is no backend in this app to
 * keep a secret behind, so this MUST only ever hold the browser-safe key:
 *
 *   - VITE_SUPABASE_URL: the project's API URL.
 *   - VITE_SUPABASE_PUBLISHABLE_KEY: Supabase's current browser-safe key
 *     (sb_publishable_...), OR VITE_SUPABASE_ANON_KEY as a fallback for
 *     projects that only expose the legacy anon (JWT) key -- createClient()
 *     accepts either format unchanged, only the dashboard label differs.
 *
 * NEVER read a service-role/secret key here (or anywhere in src/) -- that
 * key bypasses Row Level Security entirely and must never reach a browser
 * bundle. RLS (see supabase/migrations/) is this app's entire data-access
 * boundary given it's a static SPA with no server.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// GitHub Actions sets `${{ secrets.X }}` to an empty string (not unset)
// when secret X doesn't exist on the repo -- so a repo that only defines
// VITE_SUPABASE_ANON_KEY still gets VITE_SUPABASE_PUBLISHABLE_KEY="" passed
// through by deploy.yml. `??` doesn't fall through on "", only null/
// undefined, so the fallback chain below must treat "" as absent too.
function nonEmpty(value: string | undefined): value is string {
  return value !== undefined && value !== "";
}

function requiredConfig(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = nonEmpty(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!nonEmpty(url) || !nonEmpty(key)) {
    throw new Error(
      "Supabase isn't configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY " +
        "(or VITE_SUPABASE_ANON_KEY) -- see .env.local.example.",
    );
  }
  return { url, key };
}

let client: SupabaseClient | null = null;

/** Lazily creates the client on first use (not at module load) so importing
 *  this module never throws in a build/test that doesn't touch cloud
 *  features -- only actually calling into Supabase requires configuration. */
export function getSupabaseClient(): SupabaseClient {
  if (client === null) {
    const { url, key } = requiredConfig();
    client = createClient(url, key);
  }
  return client;
}

/** True once VITE_SUPABASE_URL/KEY are present -- lets UI code hide cloud
 *  features entirely rather than surfacing a runtime error when this app is
 *  run without Supabase configured. */
export function isSupabaseConfigured(): boolean {
  return (
    nonEmpty(import.meta.env.VITE_SUPABASE_URL) &&
    (nonEmpty(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || nonEmpty(import.meta.env.VITE_SUPABASE_ANON_KEY))
  );
}
