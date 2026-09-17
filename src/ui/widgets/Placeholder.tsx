/**
 * MinimalBooks
 * ui/widgets/Placeholder.tsx
 *
 * Stand-in for a nav entry whose screen hasn't been built yet in the
 * current phase (see ui/nav.ts) -- TS port of Mbooks' placeholder_book.py.
 */

export function Placeholder({ title }: { title: string }) {
  return (
    <div class="placeholder-screen">
      <h2>{title}</h2>
      <p>Coming in a later phase.</p>
    </div>
  );
}
