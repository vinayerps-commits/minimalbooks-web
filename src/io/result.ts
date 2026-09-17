/**
 * MinimalBooks
 * io/result.ts
 *
 * Shared Result shape for every io/ module -- never throws, so ui/ code
 * shows an error message the same way at every call site instead of
 * needing a try/catch per call. Mirrors minimalcadWEB's io/cloudDrawings.ts
 * CloudResult<T> pattern.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function describeError(error: { message: string } | null): string {
  return error?.message ?? "Unknown error";
}
