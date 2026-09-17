/**
 * MinimalBooks
 * main.tsx
 *
 * Entry point: wires auth state to the store, loads the current company
 * once a user is known, and mounts App.
 */

import { render } from "preact";
import "./style.css";
import { App } from "./ui/App";
import { NotConfiguredScreen } from "./ui/NotConfiguredScreen";
import { onAuthStateChange } from "./lib/auth";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { getMyCompany } from "./io/companies";
import { bootstrapping, currentCompany, currentUser } from "./ui/store";

const root = document.getElementById("app");
if (root === null) throw new Error("#app element not found");

// Guard before touching the Supabase client at all -- getSupabaseClient()
// throws synchronously when unconfigured, and this app (unlike
// minimalcadWEB) has no offline mode to fall back into: Supabase is the
// entire backend, so an unconfigured deploy needs a clear message here
// rather than an unhandled exception during module init.
if (!isSupabaseConfigured()) {
  render(<NotConfiguredScreen />, root);
} else {
  onAuthStateChange(async (user) => {
    currentUser.value = user;

    if (!user) {
      currentCompany.value = null;
      bootstrapping.value = false;
      return;
    }

    const result = await getMyCompany();
    currentCompany.value = result.ok ? result.value : null;
    bootstrapping.value = false;
  });

  render(<App />, root);
}
