import { useEffect, useRef } from "react";
import type { DataTableProps } from "./DataTable.types";
import { Button } from "../Button";
import { Icon, type IconName } from "../Icon";
import { Spinner } from "../Spinner";
import { InfoWrapper } from "../InfoWrapper";

/**
 * Resolves the icon shown for a row action.
 * Falls back by action id so icon-only actions remain visible even when icon is omitted.
 */
const resolveActionIcon = (actionId: string, configuredIcon?: string): IconName => {
  const normalizedIcon = String(configuredIcon ?? "").trim().toLowerCase();
  const configuredIconMap: Record<string, IconName> = {
    eye: "eye",
    download: "download",
    edit: "edit",
    pencil: "pencil",
    trash: "trash",
    "trash-2": "trash-2",
    archive: "archive",
    search: "search",
    filter: "filter",
    info: "info",
    "refresh-cw": "refresh-cw",
    "arrow-left": "arrow-left",
    upload: "upload",
    "file-up": "file-up",
    x: "x",
  };
  if (normalizedIcon && configuredIconMap[normalizedIcon]) {
    return configuredIconMap[normalizedIcon];
  }

  const normalizedActionId = String(actionId ?? "").trim().toLowerCase();
  if (normalizedActionId.includes("view")) return "eye";
  if (normalizedActionId.includes("download")) return "download";
  if (normalizedActionId.includes("edit") || normalizedActionId.includes("update")) return "edit";
  if (normalizedActionId.includes("delete") || normalizedActionId.includes("trash")) return "trash";
  if (normalizedActionId.includes("archive")) return "archive";
  if (normalizedActionId.includes("restore") || normalizedActionId.includes("unarchive")) return "refresh-cw";

  return "info";
};

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
                          const iconName = resolveActionIcon(action.id, action.icon);

                          const buttonElement = (
                            <Button
                              key={action.id}
                              variant={action.variant ?? "light"}
                              size="sm"
                              className={(action.className ?? "").trim()}
                              disabled={disabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row, e);
                              }}
                            >
                              <Icon name={iconName} className="fs-16" />
                            </Button>
                          );

                          return (
                            <InfoWrapper
                              key={action.id}
                              content={label}
                              position="top"
                              trigger={buttonElement}
                              showOn="hover"
                            />
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
