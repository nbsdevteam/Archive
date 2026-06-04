import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DataListProps } from "../DataTable/DataTable.types";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";
import { getColumnCardLabel, resolveActionIcon, stopPropagation } from "../DataTable/datatableShared";
import { RowActionsPortalMenu } from "../DataTable/RowActionsPortalMenu";

/**
 * Responsive card/list layout for tabular data (label/value rows per column, kebab row actions).
 * Use directly where only the list UI is needed, or compose via DataTable (responsive "auto" | "cards").
 */
export function DataList<T>({
  data,
  getRowId,
  columns,
  loading = false,
  emptyMessage = null,
  onRowClick,
  rowActions,
  selection,
  rowClassName,
  className = "",
}: DataListProps<T>) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [openActionsRowId, setOpenActionsRowId] = useState<string | null>(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!openActionsRowId) return;
    const stillExists = data.some((row) => String(getRowId(row)) === openActionsRowId);
    if (!stillExists) {
      setOpenActionsRowId(null);
      setActionsMenuAnchor(null);
    }
  }, [data, getRowId, openActionsRowId]);

  const hasSelection = Boolean(selection);
  const hasActions = Boolean(rowActions && rowActions.length > 0);

  const handleSelectionToggle = useCallback(
    (rowId: string | number) => {
      if (selection) selection.onToggle(rowId);
    },
    [selection]
  );

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
        setActionsMenuAnchor(null);
      }
    },
    [data, getRowId, rowActions]
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

  return (
    <div ref={listRef} className={`datatable-cards ${className}`.trim()}>
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
            const rowClass = rowClassName ? rowClassName(row) : "";
            return (
              <li key={rowIdStr} className="datatable-card-item">
                <div
                  className={`datatable-card rounded border mb-2 ${rowClass}`.trim()}
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
                              const opening = openActionsRowId !== rowIdStr;
                              setOpenActionsRowId(opening ? rowIdStr : null);
                              setActionsMenuAnchor(opening ? e.currentTarget : null);
                            }}
                          >
                            <Icon name="more-vertical" style={{ width: "1.25rem", height: "1.25rem" }} />
                          </button>
                          {openActionsRowId === rowIdStr && (
                            <RowActionsPortalMenu
                              open
                              anchor={actionsMenuAnchor}
                              onClose={() => {
                                setOpenActionsRowId(null);
                                setActionsMenuAnchor(null);
                              }}
                            >
                              {rowActions!
                                .filter((action) => action.visible?.(row) !== false)
                                .map((action) => {
                                  const disabled = action.disabled?.(row);
                                  const label = action.renderLabel ? action.renderLabel(row) : action.label;
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
                            </RowActionsPortalMenu>
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
}
