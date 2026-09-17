/**
 * MinimalBooks
 * ui/App.tsx
 *
 * Top-level routing by app state, not a URL router (matches minimalcadWEB's
 * single-page-no-router shape): no user -> AuthScreen; user but no company
 * yet -> CompanySetup (first run); both present -> Shell.
 */

import { currentCompany, currentUser, bootstrapping } from "./store";
import { AuthScreen } from "./AuthScreen";
import { CompanySetup } from "./CompanySetup";
import { Shell } from "./Shell";

export function App() {
  if (bootstrapping.value) {
    return <div class="app-loading">Loading...</div>;
  }
  if (!currentUser.value) {
    return <AuthScreen />;
  }
  if (!currentCompany.value) {
    return <CompanySetup />;
  }
  return <Shell />;
}
