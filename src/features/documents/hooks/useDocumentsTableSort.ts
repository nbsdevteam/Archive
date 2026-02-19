/**
 * Client-side table sort for documents: directional (asc/desc) and group-to-top cycling.
 */

import { useCallback, useMemo, useState } from "react";

import type { Document } from "@/app/adapter/api/documents.api";
import { parseDisplayUploadDate } from "@/shared/utils/format/date";

/** Column ids that support ascending/descending sort. */
const DIRECTIONAL_COLUMN_IDS = ["name", "barcode", "uploadDate"] as const;

/** Column ids that support group-to-top cycling (alphabetical groups). */
const GROUP_COLUMN_IDS = ["type", "department", "company", "status"] as const;

export type SortableColumnId =
  | (typeof DIRECTIONAL_COLUMN_IDS)[number]
  | (typeof GROUP_COLUMN_IDS)[number];

export type DocumentsTableSortState =
  | {
      kind: "directional";
      column: (typeof DIRECTIONAL_COLUMN_IDS)[number];
      direction: "asc" | "desc";
    }
  | {
      kind: "group";
      column: (typeof GROUP_COLUMN_IDS)[number];
      pivotIndex: number;
    }
  | null;

/** Map from group column id to getter that returns the document’s display value for that column. */
type GroupColumnId = (typeof GROUP_COLUMN_IDS)[number];
const GROUP_COLUMN_VALUE_GETTERS: Record<
  GroupColumnId,
  (doc: Document) => string
> = {
  type: (doc) => (doc.document_type_name || doc.document_type?.name) ?? "",
  department: (doc) => (doc.department_name || doc.department?.name) ?? "",
  company: (doc) => doc.company_name ?? "",
  status: (doc) => doc.status ?? "",
};

/** Returns sortable string for a document for a group column (used in group cycling). */
function getDocumentGroupValue(
  document: Document,
  groupColumnId: GroupColumnId,
): string {
  const rawValue = GROUP_COLUMN_VALUE_GETTERS[groupColumnId](document);
  const trimmed = String(rawValue).trim();
  return trimmed || "–";
}

/**
 * Returns a normalized string for name-based comparison (title or name, lowercased).
 */
function getDocumentNameForSort(document: Document): string {
  const rawName = document.name ?? document.title ?? "";
  return String(rawName).toLowerCase().trim();
}

/**
 * Compares two barcode strings; numeric-only strings are compared as numbers for natural order.
 */
function compareBarcodeStrings(barcodeA: string, barcodeB: string): number {
  const trimmedA = barcodeA.trim();
  const trimmedB = barcodeB.trim();
  const numericA = /^\d+$/.test(trimmedA) ? parseInt(trimmedA, 10) : NaN;
  const numericB = /^\d+$/.test(trimmedB) ? parseInt(trimmedB, 10) : NaN;
  if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
    return numericA - numericB;
  }
  return trimmedA.localeCompare(trimmedB, undefined, { numeric: true });
}

type NonNullSortState = NonNullable<DocumentsTableSortState>;

/** Item used during sort: document plus its original index for stable sort. */
type DocumentWithIndex = { document: Document; originalIndex: number };

/**
 * Sorts documents by a directional column (name, barcode, or uploadDate) asc/desc.
 */
function applyDirectionalSort(
  documentsWithIndex: DocumentWithIndex[],
  sortState: Extract<NonNullSortState, { kind: "directional" }>,
): Document[] {
  const { column, direction } = sortState;
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (column === "name") {
    documentsWithIndex.sort((itemA, itemB) => {
      const nameA = getDocumentNameForSort(itemA.document);
      const nameB = getDocumentNameForSort(itemB.document);
      const comparison = nameA.localeCompare(nameB, undefined, {
        sensitivity: "base",
      });
      const byIndex = itemA.originalIndex - itemB.originalIndex;
      return comparison !== 0 ? directionMultiplier * comparison : byIndex;
    });
  } else if (column === "barcode") {
    const getBarcodeString = (document: Document) =>
      String(document.barcode ?? "").trim();
    documentsWithIndex.sort((itemA, itemB) => {
      const comparison = compareBarcodeStrings(
        getBarcodeString(itemA.document),
        getBarcodeString(itemB.document),
      );
      const byIndex = itemA.originalIndex - itemB.originalIndex;
      return comparison !== 0 ? directionMultiplier * comparison : byIndex;
    });
  } else {
    // uploadDate: parseDisplayUploadDate (number | null)
    documentsWithIndex.sort((itemA, itemB) => {
      const uploadTimeA = parseDisplayUploadDate(itemA.document.upload_date) as
        | number
        | null;
      const uploadTimeB = parseDisplayUploadDate(itemB.document.upload_date) as
        | number
        | null;
      const timestampA = uploadTimeA ?? -Infinity;
      const timestampB = uploadTimeB ?? -Infinity;
      const comparison = timestampA - timestampB;
      const byIndex = itemA.originalIndex - itemB.originalIndex;
      return comparison !== 0 ? directionMultiplier * comparison : byIndex;
    });
  }
  return documentsWithIndex.map(({ document }) => document);
}

/**
 * Sorts by group column: one value at top, rest in alphabetical order.
 */
function applyGroupSort(
  documents: Document[],
  documentsWithIndex: DocumentWithIndex[],
  sortState: Extract<NonNullSortState, { kind: "group" }>,
): Document[] {
  const { column: groupColumnId, pivotIndex } = sortState;
  const groupValues = documents.map((document) =>
    getDocumentGroupValue(document, groupColumnId),
  );
  const baseCompare = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: "base" });
  const uniqueGroupValuesSorted = [...new Set(groupValues)].sort(baseCompare);
  if (uniqueGroupValuesSorted.length === 0) {
    return documents;
  }
  const sortedLength = uniqueGroupValuesSorted.length;
  const pivotGroupValue = uniqueGroupValuesSorted[pivotIndex % sortedLength];
  /** 0 if value is the pivot (first), else 1. */
  const getPivotRank = (groupValue: string) =>
    groupValue === pivotGroupValue ? 0 : 1;
  /** Order after pivot: 0 for pivot, then 1-based index in sorted list. */
  const getGroupOrder = (groupValue: string) => {
    if (groupValue === pivotGroupValue) {
      return 0;
    }
    const valueIndex = uniqueGroupValuesSorted.indexOf(groupValue);
    return valueIndex < 0 ? uniqueGroupValuesSorted.length : valueIndex + 1;
  };

  documentsWithIndex.sort((itemA, itemB) => {
    const groupValueA = getDocumentGroupValue(itemA.document, groupColumnId);
    const groupValueB = getDocumentGroupValue(itemB.document, groupColumnId);
    const rankA = getPivotRank(groupValueA);
    const rankB = getPivotRank(groupValueB);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const orderA = getGroupOrder(groupValueA);
    const orderB = getGroupOrder(groupValueB);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return itemA.originalIndex - itemB.originalIndex;
  });
  return documentsWithIndex.map(({ document }) => document);
}

/**
 * Applies the current sort state to the document list (directional or group).
 */
function applySort(
  documents: Document[],
  sortState: NonNullSortState,
): Document[] {
  if (documents.length === 0) {
    return documents;
  }
  const documentsWithIndex: DocumentWithIndex[] = documents.map(
    (document, originalIndex) => ({
      document,
      originalIndex,
    }),
  );

  if (sortState.kind === "directional") {
    return applyDirectionalSort(documentsWithIndex, sortState);
  }
  return applyGroupSort(documents, documentsWithIndex, sortState);
}

/**
 * Client-side sort hook for the documents table.
 * Directional columns (name, barcode, uploadDate): toggle asc/desc.
 * Group columns (type, department, company, status): cycle which alphabetical group is first.
 * Sorting is stable and applies only to the current page.
 */
export function useDocumentsTableSort(documents: Document[]) {
  const [sortState, setSortState] = useState<DocumentsTableSortState>(null);

  const sortedDocuments = useMemo(
    () => (sortState ? applySort(documents, sortState) : documents),
    [documents, sortState],
  );

  /**
   * Handles column header sort click: toggles asc/desc for directional columns,
   * cycles pivot for group columns.
   */
  const onSortClick = useCallback((columnId: string) => {
    const clickedAsDirectional =
      columnId as (typeof DIRECTIONAL_COLUMN_IDS)[number];
    const clickedAsGroup = columnId as (typeof GROUP_COLUMN_IDS)[number];

    if (DIRECTIONAL_COLUMN_IDS.includes(clickedAsDirectional)) {
      setSortState((previousSortState) => {
        if (
          previousSortState?.kind === "directional" &&
          previousSortState.column === clickedAsDirectional
        ) {
          return {
            kind: "directional" as const,
            column: clickedAsDirectional,
            direction: previousSortState.direction === "asc" ? "desc" : "asc",
          };
        }
        return {
          kind: "directional" as const,
          column: clickedAsDirectional,
          direction: "asc" as const,
        };
      });
      return;
    }

    if (GROUP_COLUMN_IDS.includes(clickedAsGroup)) {
      setSortState((previousSortState) => {
        if (
          previousSortState?.kind === "group" &&
          previousSortState.column === clickedAsGroup
        ) {
          return {
            kind: "group" as const,
            column: clickedAsGroup,
            pivotIndex: previousSortState.pivotIndex + 1,
          };
        }
        return {
          kind: "group" as const,
          column: clickedAsGroup,
          pivotIndex: 0,
        };
      });
    }
  }, []);

  type SortIconResult = { type: "asc" | "desc"; groupLabel?: string } | null;
  /** Returns sort icon state: asc/desc for arrow highlight; groupLabel when column uses group cycling (for aria/title). */
  const getSortIconForColumn = useCallback(
    (columnId: string): SortIconResult => {
      if (!sortState) {
        return null;
      }
      const columnAsDirectional =
        columnId as (typeof DIRECTIONAL_COLUMN_IDS)[number];
      const columnAsGroup = columnId as (typeof GROUP_COLUMN_IDS)[number];
      if (
        sortState.kind === "directional" &&
        sortState.column === columnAsDirectional
      ) {
        return { type: sortState.direction };
      }
      if (sortState.kind === "group" && sortState.column === columnAsGroup) {
        const groupVals = documents.map((doc) =>
          getDocumentGroupValue(doc, columnAsGroup),
        );
        const uniqueValuesSorted = [...new Set(groupVals)].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" }),
        );
        const groupLabel =
          uniqueValuesSorted.length > 0
            ? uniqueValuesSorted[
                sortState.pivotIndex % uniqueValuesSorted.length
              ]
            : undefined;
        // Alternate up/down arrow by pivot so group columns toggle like directional columns
        const direction = sortState.pivotIndex % 2 === 0 ? "asc" : "desc";
        return { type: direction, groupLabel };
      }
      return null;
    },
    [sortState, documents],
  );

  return { sortState, sortedDocuments, onSortClick, getSortIconForColumn };
}
