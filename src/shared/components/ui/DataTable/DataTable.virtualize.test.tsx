import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "./DataTable";
import type { ColumnDef } from "./DataTable.types";

interface Row {
  id: number;
  name: string;
}

const columns: ColumnDef<Row>[] = [{ id: "name", header: "Name", render: (row) => row.name }];
const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

function setDesktopViewport(isDesktop: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("min-width") ? isDesktop : !isDesktop,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

describe("DataTable virtualize", () => {
  beforeEach(() => {
    setDesktopViewport(true);
  });

  it("mounts only a window of a long list", () => {
    render(<DataTable data={makeRows(5000)} getRowId={(r) => r.id} columns={columns} virtualize />);

    const rows = document.querySelectorAll("tr[data-row-id]");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(100);
    expect(screen.getByText("Row 1")).toBeInTheDocument();
    expect(screen.queryByText("Row 5000")).not.toBeInTheDocument();
  });

  it("reserves the height of unmounted rows with a spacer", () => {
    render(
      <DataTable data={makeRows(1000)} getRowId={(r) => r.id} columns={columns} virtualize estimatedRowHeight={50} />,
    );

    const spacers = document.querySelectorAll<HTMLTableCellElement>('tr[aria-hidden="true"] td');
    const bottom = spacers[spacers.length - 1];
    expect(parseFloat(bottom.style.height)).toBeGreaterThan(40000);
  });

  it("keeps the first row's stripe parity with spacers", () => {
    render(<DataTable data={makeRows(1000)} getRowId={(r) => r.id} columns={columns} virtualize />);

    // Row index 0 must sit at an odd :nth-of-type position, as it does without windowing.
    const allRows = Array.from(document.querySelectorAll("tbody > tr"));
    const firstDataRow = allRows.findIndex((tr) => tr.hasAttribute("data-row-id"));
    expect((firstDataRow + 1) % 2).toBe(1);
  });

  it("mounts only the table on desktop", () => {
    render(<DataTable data={makeRows(10)} getRowId={(r) => r.id} columns={columns} virtualize />);

    expect(document.querySelector("table")).toBeInTheDocument();
    expect(document.querySelector(".datatable-cards")).not.toBeInTheDocument();
  });

  it("mounts only the cards below the breakpoint", () => {
    setDesktopViewport(false);
    render(<DataTable data={makeRows(1000)} getRowId={(r) => r.id} columns={columns} virtualize />);

    expect(document.querySelector("table")).not.toBeInTheDocument();
    const cards = document.querySelectorAll(".datatable-card-item");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(100);
  });

  it("leaves non-virtual tables unchanged: every row, both layouts", () => {
    render(<DataTable data={makeRows(300)} getRowId={(r) => r.id} columns={columns} />);

    expect(document.querySelectorAll("tr[data-row-id]")).toHaveLength(300);
    expect(document.querySelector(".datatable-cards")).toBeInTheDocument();
    expect(document.querySelectorAll('tr[aria-hidden="true"]')).toHaveLength(0);
  });

  it("shows the empty message and spinner states when virtualized", () => {
    const { rerender } = render(
      <DataTable data={[]} getRowId={(r: Row) => r.id} columns={columns} virtualize emptyMessage="Nothing here" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();

    rerender(<DataTable data={[]} getRowId={(r: Row) => r.id} columns={columns} virtualize loading />);
    expect(document.querySelectorAll('tr[aria-hidden="true"]')).toHaveLength(0);
  });
});
