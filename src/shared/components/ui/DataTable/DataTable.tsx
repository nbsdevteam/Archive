import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DataTableProps, ColumnDef } from "./DataTable.types";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import { Spinner } from "../Spinner";

/** Prevents click from bubbling to parent (e.g. row click). */
function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

/** Returns a string label for a column in card view: mobileLabel > string header > id. */
function getColumnCardLabel<T>(col: ColumnDef<T>): string {
  if (col.mobileLabel) return col.mobileLabel;
  if (typeof col.header === "string") return col.header;
  return col.id;
}

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
  actionsColumnHeader,
  tableClassName = "table table-striped mb-0",
  tbodyClassName,
  responsive = "auto",
  cardsBelow = "lg",
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [openActionsRowId, setOpenActionsRowId] = useState<string | null>(null);

  const showTable = responsive === "table" || responsive === "auto";
  const showCards = responsive === "cards" || responsive === "auto";
  const tableDisplayClass = showTable && showCards ? (cardsBelow === "lg" ? "d-none d-lg-block" : "d-none d-md-block") : "";
  const cardsDisplayClass = showTable && showCards ? (cardsBelow === "lg" ? "d-block d-lg-none" : "d-block d-md-none") : "";

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el && selection) el.indeterminate = selection.isIndeterminate;
  }, [selection?.isIndeterminate]);

  // Keep row-actions menu state valid when table data changes.
  useEffect(() => {
    if (!openActionsRowId) return;
    const stillExists = data.some((row) => String(getRowId(row)) === openActionsRowId);
    if (!stillExists) setOpenActionsRowId(null);
  }, [data, getRowId, openActionsRowId]);

  /** Close the open row-actions menu on outside click (single listener: no AbortController). */
  useEffect(() => {
    if (!openActionsRowId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenActionsRowId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openActionsRowId]);

  const hasSelection = Boolean(selection);
  const hasActions = Boolean(rowActions && rowActions.length > 0);
  const colSpan =
    columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0);

  /** Handles row click by reading data-row-id and invoking onRowClick with the row. */
  const handleTableRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const id = e.currentTarget.getAttribute("data-row-id");
      if (id == null || !onRowClick) return;
      const row = data.find((r) => String(getRowId(r)) === id);
      if (row) onRowClick(row);
    },
    [data, getRowId, onRowClick]
  );

  /** Toggles selection for the given row id (uses typed id so checked state matches selection). */
  const handleSelectionToggle = useCallback(
    (rowId: string | number) => {
      if (selection) selection.onToggle(rowId);
    },
    [selection]
  );

  /** Handles row action menu item click: runs action and closes menu. */
  const handleRowActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const actionId = e.currentTarget.dataset.actionId;
      const rowId = e.currentTarget.dataset.rowId;
      const row = data.find((r) => String(getRowId(r)) === rowId);
      const action = rowActions?.find((a) => a.id === actionId);
      if (row && action) {
        action.onClick(row, e);
        setOpenActionsRowId(null);
      }
    },
    [data, getRowId, rowActions]
  );

  const tableBlock = (
    <div className={`table-responsive datatable-responsive-wrap ${tableDisplayClass}`.trim()}>
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
                      aria-label={selection!.isIndeterminate ? t("common.uncheckAll") : t("common.checkAll")}
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
              <th className="text-end">{actionsColumnHeader ?? t("common.actions")}</th>
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
              const rowIdStr = String(rowId);
              const isSelected = hasSelection && selection!.selectedIds.includes(rowId);
              const rowClickHandler = onRowClick ? handleTableRowClick : undefined;

              return (
                <tr
                  key={rowIdStr}
                  style={rowClickHandler ? { cursor: "pointer" } : undefined}
                  onClick={rowClickHandler}
                  data-row-id={rowIdStr}
                >
                  {hasSelection && (
                    <td onClick={stopPropagation}>
                      <div className="form-check mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isSelected}
                          data-row-id={rowIdStr}
                          onChange={() => handleSelectionToggle(rowId)}
                          onClick={stopPropagation}
                          aria-label={
                            selection!.getRowAriaLabel
                              ? selection!.getRowAriaLabel(row)
                              : t("common.selectRow", { defaultValue: "Select row", rowId })
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
                      onClick={stopPropagation}
                    >
                      <div className="datatable-row-actions-dropdown position-relative d-inline-flex">
                        <button
                          type="button"
                          className="datatable-row-actions-toggle p-0 btn btn-link btn-sm text-body-secondary text-decoration-none shadow-none d-inline-flex align-items-center justify-content-center"
                          aria-label={`${t("common.actionsForRow")} ${rowId}`}
                          aria-expanded={openActionsRowId === rowIdStr}
                          aria-haspopup="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionsRowId(openActionsRowId === rowIdStr ? null : rowIdStr);
                          }}
                        >
                          <Icon name="more-vertical" style={{ width: "1.25rem", height: "1.25rem" }} />
                        </button>
                        {openActionsRowId === rowIdStr && (
                          <ul
                            className="dropdown-menu dropdown-menu-end show"
                            style={{ position: "absolute", top: "100%", right: 0, zIndex: 1050 }}
                          >
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
                                  <li key={action.id}>
                                    <button
                                      type="button"
                                      disabled={disabled}
                                      className={`dropdown-item d-flex align-items-center gap-2 ${isDanger ? "text-danger" : ""}`.trim()}
                                      data-testid={action.id ? `row-action-${action.id}` : undefined}
                                      data-action-id={action.id}
                                      data-row-id={rowIdStr}
                                      onClick={handleRowActionClick}
                                    >
                                      <Icon name={iconName} style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                      <span>{label}</span>
                                    </button>
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                      </div>
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

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const id = e.currentTarget.getAttribute("data-row-id");
      if (id == null || !onRowClick) return;
      const row = data.find((r) => String(getRowId(r)) === id);
      if (row) onRowClick(row);
    },
    [data, getRowId, onRowClick]
  );

  const cardsBlock = showCards && (
    <div className={`datatable-cards ${cardsDisplayClass}`.trim()}>
      {loading ? (
        <div className="datatable-cards-loading text-center py-4">
          <Spinner size="md" />
        </div>
      ) : data.length === 0 ? (
        <div className="datatable-cards-empty text-center py-4 text-muted">{emptyMessage}</div>
      ) : (
        <ul className="datatable-cards-list list-unstyled mb-0">
          {data.map((row) => {
            const rowId = getRowId(row);
            const rowIdStr = String(rowId);
            const isSelected = hasSelection && selection!.selectedIds.includes(rowId);
            return (
              <li key={rowIdStr} className="datatable-card-item">
                <div
                  className="datatable-card rounded border mb-2"
                  data-row-id={rowIdStr}
                  onClick={onRowClick ? handleCardClick : undefined}
                  style={onRowClick ? { cursor: "pointer" } : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleCardClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                          }
                        }
                      : undefined
                  }
                >
                  <div className="datatable-card-header d-flex align-items-center justify-content-between gap-2 p-2 border-bottom">
                    {hasSelection && (
                      <div className="form-check mb-0" onClick={stopPropagation}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isSelected}
                          data-row-id={rowIdStr}
                          onChange={() => handleSelectionToggle(rowId)}
                          onClick={stopPropagation}
                          aria-label={
                            selection!.getRowAriaLabel
                              ? selection!.getRowAriaLabel(row)
                              : t("common.selectRow", { defaultValue: "Select row", rowId })
                          }
                        />
                      </div>
                    )}
                    <div className="d-flex align-items-center ms-auto" onClick={stopPropagation}>
                      {hasActions && (
                        <div className="datatable-row-actions-dropdown position-relative d-inline-flex">
                          <button
                            type="button"
                            className="datatable-row-actions-toggle p-0 btn btn-link btn-sm text-body-secondary text-decoration-none shadow-none d-inline-flex align-items-center justify-content-center"
                            aria-label={`${t("common.actionsForRow")} ${rowId}`}
                            aria-expanded={openActionsRowId === rowIdStr}
                            aria-haspopup="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionsRowId(openActionsRowId === rowIdStr ? null : rowIdStr);
                            }}
                          >
                            <Icon name="more-vertical" style={{ width: "1.25rem", height: "1.25rem" }} />
                          </button>
                          {openActionsRowId === rowIdStr && (
                            <ul
                              className="dropdown-menu dropdown-menu-end show"
                              style={{ position: "absolute", top: "100%", right: 0, zIndex: 1050 }}
                            >
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
                                    <li key={action.id}>
                                      <button
                                        type="button"
                                        disabled={disabled}
                                        className={`dropdown-item d-flex align-items-center gap-2 ${isDanger ? "text-danger" : ""}`.trim()}
                                        data-testid={action.id ? `row-action-${action.id}` : undefined}
                                        data-action-id={action.id}
                                        data-row-id={rowIdStr}
                                        onClick={handleRowActionClick}
                                      >
                                        <Icon name={iconName} style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                        <span>{label}</span>
                                      </button>
                                    </li>
                                  );
                                })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="datatable-card-body p-2">
                    {columns.map((col) => (
                      <div key={col.id} className="datatable-card-row d-flex flex-wrap gap-1 gap-sm-2 mb-1">
                        <span className="datatable-card-label text-muted small">{getColumnCardLabel(col)}</span>
                        <span className="datatable-card-value flex-grow-1">{col.render(row)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div ref={tableRef} className="datatable-wrapper">
      {showTable && tableBlock}
      {cardsBlock}
    </div>
  );
}
