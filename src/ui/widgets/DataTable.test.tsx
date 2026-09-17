// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent, within } from "@testing-library/preact";
import { DataTable, type DataTableColumn } from "./DataTable";

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: "1", name: "Charlie", amount: 30 },
  { id: "2", name: "Alice", amount: 10 },
  { id: "3", name: "Bob", amount: 20 },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", label: "Name", accessor: (r) => r.name, sortable: true, filter: "text" },
  { key: "amount", label: "Amount", accessor: (r) => r.amount, sortable: true, align: "right" },
];

function bodyNames() {
  const body = screen.getAllByRole("rowgroup")[1]!;
  return within(body)
    .getAllByRole("row")
    .map((row) => row.querySelectorAll("td")[0]!.textContent);
}

describe("DataTable", () => {
  it("renders rows in the given order by default (no sort)", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(bodyNames()).toEqual(["Charlie", "Alice", "Bob"]);
  });

  it("sorts ascending, then descending, then back to original order on repeated header clicks", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const header = screen.getByText("Name");

    fireEvent.click(header);
    expect(bodyNames()).toEqual(["Alice", "Bob", "Charlie"]);

    fireEvent.click(header);
    expect(bodyNames()).toEqual(["Charlie", "Bob", "Alice"]);

    fireEvent.click(header);
    expect(bodyNames()).toEqual(["Charlie", "Alice", "Bob"]);
  });

  it("text-filters rows by the name column", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const filterInput = screen.getByPlaceholderText("Filter…");
    fireEvent.input(filterInput, { target: { value: "al" } });
    expect(bodyNames()).toEqual(["Alice"]);
  });

  it("shows the empty message when no rows match", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeTruthy();
  });
});
