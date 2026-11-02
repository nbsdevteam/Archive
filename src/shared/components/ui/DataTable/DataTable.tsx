import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useViewport } from "@/shared/hooks/useViewport";
import { useWindowVirtualList } from "@/shared/hooks/useWindowVirtualList";
import type { DataTableProps } from "./DataTable.types";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";
import { DataList } from "../DataList/DataList";
import { resolveActionIcon, stopPropagation, TruncatedCell } from "./datatableShared";
import { RowActionsPortalMenu } from "./RowActionsPortalMenu";

const SPACER_CELL_STYLE: React.CSSProperties = {
  padding: 0,
  border: 0,
  background: "transparent",
  boxShadow: "none",
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
  actionsColumnHeader,
  tableClassName = "table table-striped mb-0",
  tbodyClassName,
  rowClassName,
  responsive = "auto",
  cardsBelow = "lg",
  actionsStyle = "menu",
  virtualize = false,
  estimatedRowHeight = 49,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const { isDesktopView, isMobileView } = useViewport();
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [openActionsRowId, setOpenActionsRowId] = useState<string | null>(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<HTMLElement | null>(null);

  const isAutoLayout = responsive === "auto";
  const isCardsViewport = cardsBelow === "lg" ? !isDesktopView : isMobileView;
  // Virtualized: mount one layout only. Otherwise both mount and CSS hides one (unchanged behaviour).
  const showTable = responsive === "table" || (isAutoLayout && !(virtualize && isCardsViewport));
  const showCards = responsive === "cards" || (isAutoLayout && !(virtualize && !isCardsViewport));
  const tableDisplayClass = showTable && showCards ? (cardsBelow === "lg" ? "d-none d-lg-block" : "d-none d-md-block") : "";
  const cardsDisplayClass = showTable && showCards ? (cardsBelow === "lg" ? "d-block d-lg-none" : "d-block d-md-none") : "";

  const isVirtualTable = virtualize && showTable && !loading && data.length > 0;
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;
  const getItemKey = useCallback((index: number) => getRowIdRef.current(data[index]), [data]);
  const virtualList = useWindowVirtualList<HTMLTableSectionElement>({
    count: data.length,
    estimateSize: estimatedRowHeight,
    getItemKey,
    enabled: isVirtualTable,
  });
  const firstVirtualIndex = virtualList.virtualItems[0]?.index ?? 0;
  const renderedRows = isVirtualTable
    ? virtualList.virtualItems.map((item) => ({ row: data[item.index], index: item.index }))
    : data.map((row, index) => ({ row, index }));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el && selection) el.indeterminate = selection.isIndeterminate;
  }, [selection?.isIndeterminate]);

  // The menu is anchored to a button inside its row. Once windowing unmounts that row the anchor is
  // detached, and reopening would position the menu from an empty rect, so close it instead.
  useEffect(() => {
    if (!isVirtualTable || !openActionsRowId) return;
    if (!renderedRows.some(({ row }) => String(getRowId(row)) === openActionsRowId)) {
      setOpenActionsRowId(null);
      setActionsMenuAnchor(null);
    }
  });

  // Keep row-actions menu state valid when table data changes.
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
        setActionsMenuAnchor(null);
      }
    },
    [data, getRowId, rowActions]
  );

  const tableBlock = (
    <div className={`table-responsive datatable-responsive-wrap ${tableDisplayClass}`.trim()}>
      <table className={tableClassName} style={{ tableLayout: "fixed", width: "100%" }}>
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
        <tbody
          ref={virtualize ? virtualList.containerRef : undefined}
          className={tbodyClassName}
          style={isVirtualTable ? { overflowAnchor: "none" } : undefined}
        >
          {isVirtualTable && (
            <>
              {/* table-striped colours rows with :nth-of-type, so keep each row's parity as rows above it unmount. */}
              {firstVirtualIndex % 2 === 0 && (
                <tr aria-hidden="true">
                  <td colSpan={colSpan} style={SPACER_CELL_STYLE} />
                </tr>
              )}
              <tr aria-hidden="true">
                <td colSpan={colSpan} style={{ ...SPACER_CELL_STYLE, height: virtualList.paddingTop }} />
              </tr>
            </>
          )}
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
            renderedRows.map(({ row, index }) => {
              const rowId = getRowId(row);
              const rowIdStr = String(rowId);
              const isSelected = hasSelection && selection!.selectedIds.includes(rowId);
              const rowClickHandler = onRowClick ? handleTableRowClick : undefined;
              const rowClass = rowClassName ? rowClassName(row) : "";

              return (
                <tr
                  key={rowIdStr}
                  ref={isVirtualTable ? virtualList.measureElement : undefined}
                  data-index={isVirtualTable ? index : undefined}
                  style={rowClickHandler ? { cursor: "pointer" } : undefined}
                  onClick={rowClickHandler}
                  data-row-id={rowIdStr}
                  className={rowClass || undefined}
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
                    <td
                      key={col.id}
                      className={[col.className, col.truncate ? "datatable-td-truncate" : ""].filter(Boolean).join(" ") || undefined}
                    >
                      {col.truncate ? <TruncatedCell>{col.render(row)}</TruncatedCell> : col.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="text-end align-middle" onClick={stopPropagation}>
                      {actionsStyle === "inline" ? (
                        <div className="d-flex gap-1 justify-content-end flex-nowrap">
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
                                <button
                                  key={action.id}
                                  type="button"
                                  disabled={disabled}
                                  className={`btn btn-outline-${isDanger ? "danger" : "secondary"} btn-sm d-inline-flex align-items-center gap-1`}
                                  data-testid={action.id ? `row-action-${action.id}` : undefined}
                                  data-action-id={action.id}
                                  data-row-id={rowIdStr}
                                  onClick={handleRowActionClick}
                                >
                                  <Icon name={iconName} style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                        </div>
                      ) : (
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
                            </RowActionsPortalMenu>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
          {isVirtualTable && (
            <tr aria-hidden="true">
              <td colSpan={colSpan} style={{ ...SPACER_CELL_STYLE, height: virtualList.paddingBottom }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const cardsBlock = showCards && (
    <DataList<T>
      data={data}
      getRowId={getRowId}
      columns={columns}
      loading={loading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      rowActions={rowActions}
      selection={selection}
      actionsColumnHeader={actionsColumnHeader}
      rowClassName={rowClassName}
      className={cardsDisplayClass}
      virtualize={virtualize}
    />
  );

  return (
    <div className="datatable-wrapper">
      {showTable && tableBlock}
      {cardsBlock}
    </div>
  );
}
