import { useEffect, useRef } from "react";
import { Dropdown } from "react-bootstrap";
import type { DataTableProps } from "./DataTable.types";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import { Spinner } from "../Spinner";

/**
 * Resolves icon for a row action: use configured icon or infer from action id so menu items always show an icon.
 */
function resolveActionIcon(actionId: string, configuredIcon?: IconName): IconName {
  if (configuredIcon) return configuredIcon;
  const id = String(actionId ?? "").toLowerCase();
  if (id.includes("view")) return "eye";
  if (id.includes("download")) return "download";
  if (id.includes("transfer")) return "arrow-right-left";
  if (id.includes("archive") && !id.includes("unarchive")) return "archive";
  if (id.includes("unarchive") || id.includes("restore")) return "refresh-cw";
  if (id.includes("trash") || id.includes("delete")) return "trash-2";
  if (id.includes("edit")) return "pencil";
  return "info";
}

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
                      className="text-end align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown align="end" drop="start">
                        <Dropdown.Toggle
                          variant="link"
                          size="sm"
                          className="p-0 text-body-secondary text-decoration-none shadow-none d-inline-flex align-items-center justify-content-center"
                          aria-label="Row actions"
                        >
                          <Icon name="more-vertical" style={{ width: "1.25rem", height: "1.25rem" }} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="dropdown-menu-end">
                          {rowActions!
                            .filter((action) => action.visible?.(row) !== false)
                            .map((action) => {
                              const disabled = action.disabled?.(row);
                              const label = action.renderLabel
                                ? action.renderLabel(row)
                                : action.label;
                              const iconName = resolveActionIcon(action.id, action.icon);
                              const isDanger =
                                action.variant === "danger" ||
                                (action.className ?? "").toLowerCase().includes("danger");
                              return (
                                <Dropdown.Item
                                  key={action.id}
                                  as="button"
                                  type="button"
                                  disabled={disabled}
                                  className={`d-flex align-items-center gap-2 ${isDanger ? "text-danger" : ""}`.trim()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row, e);
                                  }}
                                >
                                  <Icon name={iconName} style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                  <span>{label}</span>
                                </Dropdown.Item>
                              );
                            })}
                        </Dropdown.Menu>
                      </Dropdown>
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
