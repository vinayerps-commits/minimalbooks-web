/**
 * MinimalBooks
 * ui/widgets/DataTable.tsx
 *
 * A generic, Excel-style sortable/filterable table -- click a column
 * header to sort (asc -> desc -> off), and a filter row under the headers
 * (text search per column, or a dropdown of that column's distinct
 * values). Every register/report screen in the app (InvoiceRegister
 * today, PurchaseRegister/SalesOrderRegister/etc. once those phases
 * exist) should render its list through this component rather than a
 * bare <table>, so filter/sort behavior stays consistent instead of being
 * rebuilt ad hoc per screen. Client-side only (filters/sorts whatever
 * `rows` it's given) -- fine at this app's per-company data volumes; a
 * server-side paged version is a later concern if a register ever grows
 * past a few thousand rows.
 */

import { useMemo, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Value used for sorting and filtering -- doesn't have to match what's displayed. */
  accessor: (row: T) => string | number | null | undefined;
  /** Optional custom cell rendering; defaults to the accessor's value. */
  render?: (row: T) => ComponentChildren;
  sortable?: boolean;
  /** "text" = free-text contains-search; "select" = dropdown of distinct accessor values. */
  filter?: "text" | "select";
  align?: "left" | "right";
}

type SortDir = "asc" | "desc";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = "No rows match.",
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  }

  const selectOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      if (col.filter !== "select") continue;
      const values = new Set<string>();
      for (const row of rows) {
        const v = col.accessor(row);
        if (v !== null && v !== undefined && v !== "") values.add(String(v));
      }
      map[col.key] = Array.from(values).sort();
    }
    return map;
  }, [columns, rows]);

  const visibleRows = useMemo(() => {
    let result = rows;

    for (const col of columns) {
      const filterValue = filters[col.key];
      if (!filterValue) continue;
      if (col.filter === "text") {
        const needle = filterValue.toLowerCase();
        result = result.filter((row) =>
          String(col.accessor(row) ?? "")
            .toLowerCase()
            .includes(needle),
        );
      } else if (col.filter === "select") {
        result = result.filter((row) => String(col.accessor(row) ?? "") === filterValue);
      }
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        result = [...result].sort((a, b) => {
          const av = col.accessor(a);
          const bv = col.accessor(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [rows, columns, filters, sortKey, sortDir]);

  const hasFilters = columns.some((c) => c.filter);

  return (
    <table class="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              class={col.sortable ? "sortable" : ""}
              onClick={col.sortable ? () => toggleSort(col.key) : undefined}
            >
              {col.label}
              {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
            </th>
          ))}
        </tr>
        {hasFilters && (
          <tr class="data-table-filter-row">
            {columns.map((col) => (
              <th key={col.key}>
                {col.filter === "text" && (
                  <input
                    placeholder="Filter…"
                    value={filters[col.key] ?? ""}
                    onInput={(e) =>
                      setFilters({ ...filters, [col.key]: (e.target as HTMLInputElement).value })
                    }
                  />
                )}
                {col.filter === "select" && (
                  <select
                    value={filters[col.key] ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, [col.key]: (e.target as HTMLSelectElement).value })
                    }
                  >
                    <option value="">All</option>
                    {(selectOptions[col.key] ?? []).map((v) => (
                      <option value={v} key={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </th>
            ))}
          </tr>
        )}
      </thead>
      <tbody>
        {visibleRows.map((row) => (
          <tr key={rowKey(row)} class={onRowClick ? "clickable-row" : ""} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={col.key} class={col.align === "right" ? "num" : ""}>
                {col.render ? col.render(row) : col.accessor(row)}
              </td>
            ))}
          </tr>
        ))}
        {visibleRows.length === 0 && (
          <tr>
            <td colSpan={columns.length} class="hint-text">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
