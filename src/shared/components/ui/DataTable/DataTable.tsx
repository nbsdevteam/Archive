import { useEffect, useRef } from "react";
import type { DataTableProps } from "./DataTable.types";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";

export function DataTable<T>({
  data,
  getRowId,
  columns,
  loading = false,
  emptyMessage = null,
  onRowClick,
  rowActions,
  selection,
  actionsColumnHeader = "Actions",
  tableClassName = "table table-striped mb-0",
  tbodyClassName,
}: DataTableProps<T>) {
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el && selection) el.indeterminate = selection.isIndeterminate;
  }, [selection?.isIndeterminate]);

  const hasSelection = Boolean(selection);
  const hasActions = Boolean(rowActions && rowActions.length > 0);
  const colSpan =
    columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="table-responsive">
      <table className={tableClassName}>
        <thead>
          <tr>
            {hasSelection && (
              <th style={{ width: "2.5rem" }} className="text-center">
                {data.length > 0 && (
                  <div className="form-check d-inline-flex justify-content-center mb-0">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className="form-check-input"
                      checked={selection!.isAllSelected}
                      onChange={selection!.onToggleAll}
                      aria-label={selection!.isIndeterminate ? "Uncheck all" : "Check all"}
                    />
                  </div>
                )}
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.id}
                style={col.width ? { width: col.width } : undefined}
                className={col.headerClassName}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="text-end">{actionsColumnHeader}</th>
            )}
          </tr>
        </thead>
        <tbody className={tbodyClassName}>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="text-center py-4">
                <Spinner size="md" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="text-center py-4 text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = hasSelection && selection!.selectedIds.includes(rowId);
              const rowClickHandler = onRowClick
                ? () => onRowClick(row)
                : undefined;

              return (
                <tr
                  key={String(rowId)}
                  style={rowClickHandler ? { cursor: "pointer" } : undefined}
                  onClick={rowClickHandler}
                >
                  {hasSelection && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="form-check mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isSelected}
                          onChange={() => selection!.onToggle(rowId)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={
                            selection!.getRowAriaLabel
                              ? selection!.getRowAriaLabel(row)
                              : `Select row ${rowId}`
                          }
                        />
                      </div>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.id} className={col.className}>
                      {col.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td
                      className="text-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rowActions!
                        .filter((action) => action.visible?.(row) !== false)
                        .map((action) => {
                          const disabled = action.disabled?.(row);
                          const label = action.renderLabel
                            ? action.renderLabel(row)
                            : action.label;
                          return (
                            <Button
                              key={action.id}
                              variant={action.variant ?? "light"}
                              size="sm"
                              className={`me-1 ${action.className ?? ""}`.trim()}
                              disabled={disabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row, e);
                              }}
                            >
                              {action.icon && (
                                <Icon name={action.icon} className="me-1" />
                              )}
                              {label}
                            </Button>
                          );
                        })}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
