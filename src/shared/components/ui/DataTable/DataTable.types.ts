import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "light" | "outline";

export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface RowAction<T> {
  id: string;
  label: ReactNode;
  /** When set, used instead of label for each row (e.g. to show loading state). */
  renderLabel?: (row: T) => ReactNode;
  icon?: string;
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
}
