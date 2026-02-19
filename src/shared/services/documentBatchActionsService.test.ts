/**
 * Unit tests for documentBatchActionsService: status normalization and
 * batch-action visibility (intersection logic) for single/mixed status and main/sub docs.
 */
import { describe, it, expect } from "vitest";
import {
  getDocumentStatusKind,
  getAllowedBatchActionsForDocumentsSelection,
  type DocumentForBatchActions,
} from "./documentBatchActionsService";

describe("getDocumentStatusKind", () => {
  it('returns "active" for status "active"', () => {
    expect(getDocumentStatusKind("active")).toBe("active");
  });

  it('returns "archived" for status "archived"', () => {
    expect(getDocumentStatusKind("archived")).toBe("archived");
  });

  it('returns "trashed" for status "trashed"', () => {
    expect(getDocumentStatusKind("trashed")).toBe("trashed");
  });

  it('returns "trashed" for status containing "trash" (case-insensitive)', () => {
    expect(getDocumentStatusKind("trash")).toBe("trashed");
    expect(getDocumentStatusKind("TRASHED")).toBe("trashed");
  });

  it('returns "trashed" for status containing "deleted"', () => {
    expect(getDocumentStatusKind("deleted")).toBe("trashed");
    expect(getDocumentStatusKind("soft_deleted")).toBe("trashed");
  });

  it('returns "unknown" for null, undefined, empty string', () => {
    expect(getDocumentStatusKind(null)).toBe("unknown");
    expect(getDocumentStatusKind(undefined)).toBe("unknown");
    expect(getDocumentStatusKind("")).toBe("unknown");
  });

  it('returns "unknown" for arbitrary string', () => {
    expect(getDocumentStatusKind("draft")).toBe("unknown");
    expect(getDocumentStatusKind("pending")).toBe("unknown");
  });
});

describe("getAllowedBatchActionsForDocumentsSelection", () => {
  it("returns all flags false when selectedIds is empty", () => {
    const docs: DocumentForBatchActions[] = [{ id: 1, status: "active", is_main_document: false }];
    const result = getAllowedBatchActionsForDocumentsSelection(docs, []);
    expect(result).toEqual({
      canBatchTransfer: false,
      canBatchArchive: false,
      canBatchTrash: false,
      canBatchRestore: false,
      canBatchUnarchive: false,
    });
  });

  it("returns all flags false when selection ids are not in documents", () => {
    const docs: DocumentForBatchActions[] = [{ id: 1, status: "active" }];
    const result = getAllowedBatchActionsForDocumentsSelection(docs, [99, 100]);
    expect(result.canBatchTransfer).toBe(false);
    expect(result.canBatchRestore).toBe(false);
  });

  it("returns all flags false when documents is empty", () => {
    const result = getAllowedBatchActionsForDocumentsSelection([], [1, 2]);
    expect(result.canBatchArchive).toBe(false);
  });

  describe("single document", () => {
    it("active sub-doc: canBatchTransfer, canBatchArchive, canBatchTrash true; restore/unarchive false", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchTransfer).toBe(true);
      expect(result.canBatchArchive).toBe(true);
      expect(result.canBatchTrash).toBe(true);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });

    it("active main doc: only canBatchArchive true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: true },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchTransfer).toBe(false);
      expect(result.canBatchArchive).toBe(true);
      expect(result.canBatchTrash).toBe(false);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });

    it("archived sub-doc: canBatchUnarchive, canBatchTrash true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "archived", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchUnarchive).toBe(true);
      expect(result.canBatchTrash).toBe(true);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchTransfer).toBe(false);
      expect(result.canBatchArchive).toBe(false);
    });

    it("archived main doc: only canBatchUnarchive true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "archived", is_main_document: true },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchUnarchive).toBe(true);
      expect(result.canBatchTrash).toBe(false);
      expect(result.canBatchTransfer).toBe(false);
    });

    it("trashed doc: only canBatchRestore true", () => {
      const docs: DocumentForBatchActions[] = [{ id: 1, status: "trashed" }];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchRestore).toBe(true);
      expect(result.canBatchArchive).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });

    it("unknown status: all false", () => {
      const docs: DocumentForBatchActions[] = [{ id: 1, status: "draft" }];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1]);
      expect(result.canBatchTransfer).toBe(false);
      expect(result.canBatchArchive).toBe(false);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });
  });

  describe("mixed status (partial intersection)", () => {
    it("one active + one archived: only canBatchTrash true (both statuses allow trash)", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: false },
        { id: 2, status: "archived", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchTransfer).toBe(false);
      expect(result.canBatchArchive).toBe(false);
      expect(result.canBatchTrash).toBe(true);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });

    it("one active + one trashed: all flags false", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: false },
        { id: 2, status: "trashed" },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchArchive).toBe(false);
    });
  });

  describe("mixed main + sub (both active)", () => {
    it("main + sub selected: only canBatchArchive true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: true },
        { id: 2, status: "active", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchArchive).toBe(true);
      expect(result.canBatchTransfer).toBe(false);
      expect(result.canBatchTrash).toBe(false);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });
  });

  describe("homogeneous selection", () => {
    it("two active sub-docs: transfer, archive, trash true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "active", is_main_document: false },
        { id: 2, status: "active", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchTransfer).toBe(true);
      expect(result.canBatchArchive).toBe(true);
      expect(result.canBatchTrash).toBe(true);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });

    it("two archived sub-docs: unarchive, trash true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "archived", is_main_document: false },
        { id: 2, status: "archived", is_main_document: false },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchUnarchive).toBe(true);
      expect(result.canBatchTrash).toBe(true);
      expect(result.canBatchRestore).toBe(false);
      expect(result.canBatchTransfer).toBe(false);
    });

    it("two trashed docs: restore true", () => {
      const docs: DocumentForBatchActions[] = [
        { id: 1, status: "trashed" },
        { id: 2, status: "trashed" },
      ];
      const result = getAllowedBatchActionsForDocumentsSelection(docs, [1, 2]);
      expect(result.canBatchRestore).toBe(true);
      expect(result.canBatchArchive).toBe(false);
      expect(result.canBatchUnarchive).toBe(false);
    });
  });
});
