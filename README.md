# MinimalBooks

A web-based, Tally-philosophy accounting app: real double-entry
ledger/voucher posting (not simplified single-entry bookkeeping), with GST
and modern web UX. TypeScript + Vite + Preact, Supabase (Postgres + Auth)
for storage, no separate backend server. Deploys as a static site to
GitHub Pages.

Architecture pattern mirrors `MinimalCAD`'s web port (`minimalcadWEB`); the
ledger/voucher domain model ports the desktop `Mbooks` prototype
(`app/core/schema.sql`, `ledger.py`, `gst.py`, `numbering.py`).

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + publishable key
npm run dev       # dev server with hot reload
npm run build     # type-checks, then builds dist/ as static files
npm run preview   # serves the built dist/ locally
npm test          # runs the vitest suite
npm run lint      # eslint
```

## Database

Apply the migrations under `supabase/migrations/` (in order) to a Supabase
project via the SQL editor or `supabase db push`. Every table is scoped by
`company_id` and protected by Row Level Security (`public.owns_company()`,
defined in `0001_companies.sql`) -- there is no server-side access control
beyond RLS, since this is a static SPA.

## What's implemented (Phase 0 -- framework)

- Email/password auth (sign up / sign in / sign out)
- First-run company setup, seeding a default chart of accounts
  (`core/defaultChartOfAccounts.ts`)
- Customers/vendors master (CRUD)
- Items master (CRUD)
- Company settings (edit)
- Declarative nav shell (`ui/nav.ts`) with placeholders for every screen in
  the product's full intended surface (Sales/Purchase/Inventory/Registers/
  Reports/GST/Settings) -- so later phases are additive, not a nav rewrite

No vouchers/ledger posting yet -- that's Phase 1 (Invoice), see the plan
this was built from.

## Architecture

- `core/` -- pure domain logic, no DOM, fully unit-tested (chart of
  accounts, and from Phase 1: GST split, voucher numbering, posting rules)
- `io/` -- Supabase reads/writes, `Result`-shaped (never throws)
- `ui/` -- Preact components + `@preact/signals` for app-wide state
  (`ui/store.ts`)
- `lib/` -- Supabase client + auth wrapper
