/**
 * MinimalBooks
 * ui/AuthScreen.tsx
 *
 * Email/password sign-in and sign-up, over lib/auth.ts. onAuthStateChange
 * (wired in main.tsx) is what actually moves the app past this screen --
 * this component just triggers sign in/up and shows the error if it fails.
 */

import { useState } from "preact/hooks";
import { signIn, signUp } from "../lib/auth";

export function AuthScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = mode === "signIn" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (mode === "signUp") setSignedUp(true);
  }

  if (signedUp) {
    return (
      <div class="auth-screen">
        <h1>MinimalBooks</h1>
        <p>Check your email to confirm your account, then sign in.</p>
        <button
          onClick={() => {
            setSignedUp(false);
            setMode("signIn");
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div class="auth-screen">
      <h1>MinimalBooks</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          />
        </label>
        {error && <p class="error-text">{error}</p>}
        <button type="submit" disabled={busy}>
          {mode === "signIn" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button class="link-button" onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
        {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
