/**
 * MinimalBooks
 * ui/NotConfiguredScreen.tsx
 *
 * Shown instead of the app when VITE_SUPABASE_URL/KEY aren't set (see
 * lib/supabaseClient.ts's isSupabaseConfigured()) -- this app has no
 * offline mode, so a clear setup message beats an unhandled exception.
 */

export function NotConfiguredScreen() {
  return (
    <div class="auth-screen">
      <h1>MinimalBooks</h1>
      <p>Supabase isn't configured yet.</p>
      <p>
        Copy <code>.env.local.example</code> to <code>.env.local</code> and fill in your Supabase
        project's URL and publishable key, then restart the dev server.
      </p>
    </div>
  );
}
