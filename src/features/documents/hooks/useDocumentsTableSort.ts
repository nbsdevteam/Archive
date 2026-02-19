import {useCallback, useMemo, useState} from 'react';

import type {Document} from '@/app/adapter/api/documents.api';
import {parseDisplayUploadDate} from '@/shared/utils/format/date';

/** Column ids that support ascending/descending sort. */
const DIRECTIONAL_COLUMNS = ['name', 'barcode', 'uploadDate'] as const;

/** Column ids that support group-to-top cycling (alphabetical groups). */
const GROUP_COLUMNS = ['type', 'department', 'company', 'status'] as const;

export type SortableColumnId =
  | (typeof DIRECTIONAL_COLUMNS)[number]
  | (typeof GROUP_COLUMNS)[number];

export type DocumentsTableSortState =
  | {kind: 'directional'; column: (typeof DIRECTIONAL_COLUMNS)[number]; direction: 'asc' | 'desc'}
  | {kind: 'group'; column: (typeof GROUP_COLUMNS)[number]; pivotIndex: number}
  | null;

const GROUP_VALUE_GETTERS: Record<(typeof GROUP_COLUMNS)[number], (d: Document) => string> = {
  type: (d) => (d.document_type_name || d.document_type?.name) ?? '',
  department: (d) => (d.department_name || d.department?.name) ?? '',
  company: (d) => d.company_name ?? '',
  status: (d) => d.status ?? '',
};

/** Returns the sortable value for a document used in group cycling (alphabetical order). */
function getGroupValue(doc: Document, column: (typeof GROUP_COLUMNS)[number]): string {
  const raw = GROUP_VALUE_GETTERS[column](doc);
  return String(raw).trim() || '–';
}

/** Returns a comparable value for directional sort (name). */
function getNameValue(doc: Document): string {
  const raw = doc.name ?? doc.title ?? '';
  return String(raw)
    .toLowerCase()
    .trim();
}

/** Numeric-aware string compare for barcode. */
function compareBarcode(a: string, b: string): number {
  const na = a.trim();
  const nb = b.trim();
  const numA = (/^\d+$/).test(na) ? parseInt(na, 10) : NaN;
  const numB = (/^\d+$/).test(nb) ? parseInt(nb, 10) : NaN;
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return na.localeCompare(nb, undefined, {numeric: true});
}

type NonNullSortState = NonNullable<DocumentsTableSortState>;

function applyDirectionalSort(
  indexed: Array<{doc: Document; i: number}>,
  sortState: Extract<NonNullSortState, {kind: 'directional'}>,
): Document[] {
  const {column, direction} = sortState;
  const mult = direction === 'asc' ? 1 : -1;

  if (column === 'name') {
    indexed.sort((a, b) => {
      const va = getNameValue(a.doc);
      const vb = getNameValue(b.doc);
      const c = va.localeCompare(vb, undefined, {sensitivity: 'base'});
      return c !== 0 ? mult * c : a.i - b.i;
    });
  } else if (column === 'barcode') {
    const ba = (doc: Document) => String(doc.barcode ?? '').trim();
    indexed.sort((a, b) => {
      const c = compareBarcode(ba(a.doc), ba(b.doc));
      return c !== 0 ? mult * c : a.i - b.i;
    });
  } else {
    indexed.sort((a, b) => {
      const ta = parseDisplayUploadDate(a.doc.upload_date);
      const tb = parseDisplayUploadDate(b.doc.upload_date);
      const aVal = ta ?? -Infinity;
      const bVal = tb ?? -Infinity;
      const c = aVal - bVal;
      return c !== 0 ? mult * c : a.i - b.i;
    });
  }
  return indexed.map(({doc}) => doc);
}

function applyGroupSort(
  documents: Document[],
  indexed: Array<{doc: Document; i: number}>,
  sortState: Extract<NonNullSortState, {kind: 'group'}>,
): Document[] {
  const {column, pivotIndex} = sortState;
  const values = [...new Set(documents.map((d) => getGroupValue(d, column)))].sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  if (values.length === 0) {
    return documents;
  }
  const pivotValue = values[pivotIndex % values.length];
  const rank = (v: string) => (v === pivotValue ? 0 : 1);
  const order = (v: string) => {
    if (v === pivotValue) {
      return 0;
    }
    const idx = values.indexOf(v);
    return idx < 0 ? values.length : idx + 1;
  };

  indexed.sort((a, b) => {
    const va = getGroupValue(a.doc, column);
    const vb = getGroupValue(b.doc, column);
    const ra = rank(va);
    const rb = rank(vb);
    if (ra !== rb) {
      return ra - rb;
    }
    const oa = order(va);
    const ob = order(vb);
    if (oa !== ob) {
      return oa - ob;
    }
    return a.i - b.i;
  });
  return indexed.map(({doc}) => doc);
}

/** Applies current sort state to a document list; used by useDocumentsTableSort. */
function applySort(documents: Document[], sortState: NonNullSortState): Document[] {
  if (documents.length === 0) {
    return documents;
  }
  const indexed = documents.map((doc, i) => ({doc, i}));

  if (sortState.kind === 'directional') {
    return applyDirectionalSort(indexed, sortState);
  }
  return applyGroupSort(documents, indexed, sortState);
}

/**
 * Client-side sort hook for the documents table.
 * Directional columns (name, barcode, uploadDate): toggle asc/desc.
 * Group columns (type, department, company, status): cycle which alphabetical group is first.
 * Sorting is stable and applies only to the current page.
 */
// eslint-disable-next-line max-lines-per-function -- state + 2 callbacks
export function useDocumentsTableSort(documents: Document[]) {
  const [sortState, setSortState] = useState<DocumentsTableSortState>(null);

  const sortedDocuments = useMemo(
    () => (sortState ? applySort(documents, sortState) : documents),
    [documents, sortState],
  );

  /** Handles column header sort click: toggles asc/desc for directional columns,
   * cycles pivot for group columns. */
  const onSortClick = useCallback((columnId: string) => {
    const dir = columnId as (typeof DIRECTIONAL_COLUMNS)[number];
    const grp = columnId as (typeof GROUP_COLUMNS)[number];

    if (DIRECTIONAL_COLUMNS.includes(dir)) {
      setSortState((prev) => {
        if (prev?.kind === 'directional' && prev.column === dir) {
          return {kind: 'directional' as const, column: dir, direction: prev.direction === 'asc' ? 'desc' : 'asc'};
        }
        return {kind: 'directional' as const, column: dir, direction: 'asc' as const};
      });
      return;
    }

    if (GROUP_COLUMNS.includes(grp)) {
      setSortState((prev) => {
        if (prev?.kind === 'group' && prev.column === grp) {
          return {kind: 'group' as const, column: grp, pivotIndex: prev.pivotIndex + 1};
        }
        return {kind: 'group' as const, column: grp, pivotIndex: 0};
      });
    }
  }, []);

  type SortIconResult = {type: 'asc' | 'desc' | 'group'; groupLabel?: string} | null;
  /** For header UI: current direction for directional column, or "group" and pivot label. */
  const getSortIconForColumn = useCallback(
    (columnId: string): SortIconResult => {
      if (!sortState) {
        return null;
      }
      const dir = columnId as (typeof DIRECTIONAL_COLUMNS)[number];
      const grp = columnId as (typeof GROUP_COLUMNS)[number];
      if (sortState.kind === 'directional' && sortState.column === dir) {
        return {type: sortState.direction};
      }
      if (sortState.kind === 'group' && sortState.column === grp) {
        const values = [...new Set(documents.map((d) => getGroupValue(d, grp)))].sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
        const label = values.length > 0 ? values[sortState.pivotIndex % values.length] : undefined;
        return {type: 'group', groupLabel: label};
      }
      return null;
    },
    [sortState, documents],
  );

  return {sortState, sortedDocuments, onSortClick, getSortIconForColumn};
}
