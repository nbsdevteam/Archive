import type { ReactNode } from "react";
import type { IconName } from "../Icon";

export type ButtonVariant = "primary" | "secondary" | "danger" | "light" | "outline";

export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  width?: string;
  className?: string;
  headerClassName?: string;
  /** Label for card view on small screens; falls back to string header or id. */
  mobileLabel?: string;
}

export interface RowAction<T> {
  id: string;
  label: ReactNode;
  /** When set, used instead of label for each row (e.g. to show loading state). */
  renderLabel?: (row: T) => ReactNode;
  icon?: IconName;
  variant?: ButtonVariant;
  className?: string;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  onClick: (row: T, e: React.MouseEvent) => void;
}

export interface SelectionConfig<T> {
  selectedIds: (string | number)[];
  onToggle: (id: string | number) => void;
  onToggleAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  getRowAriaLabel?: (row: T) => string;
}

/** When to show card rows: "lg" = below 992px, "md" = below 768px. */
export type DataTableCardsBreakpoint = "md" | "lg";

export interface DataTableProps<T> {
  data: T[];
  getRowId: (row: T) => string | number;
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  selection?: SelectionConfig<T>;
  actionsColumnHeader?: ReactNode;
  tableClassName?: string;
  tbodyClassName?: string;
  /** "auto" = cards below breakpoint, "table" = always table, "cards" = always cards. Default "auto". */
  responsive?: "auto" | "table" | "cards";
  /** Breakpoint below which card rows are shown when responsive is "auto". Default "lg". */
  cardsBelow?: DataTableCardsBreakpoint;
}
