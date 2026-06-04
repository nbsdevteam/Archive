import { describe, expect, it } from "vitest";
import { gateBatchActionsForDelete } from "./capabilityGating";
import type { DocumentBatchActionsResult } from "../services/documentBatchActionsService";

const baseActions: DocumentBatchActionsResult = {
  canBatchTransfer: true,
  canBatchArchive: true,
  canBatchUnarchive: false,
  canBatchRestore: false,
  canBatchTrash: true,
};

describe("gateBatchActionsForDelete", () => {
  it("keeps canBatchTrash when user can delete files", () => {
    expect(gateBatchActionsForDelete(baseActions, true).canBatchTrash).toBe(true);
  });

  it("clears canBatchTrash when user cannot delete files", () => {
    const gated = gateBatchActionsForDelete(baseActions, false);
    expect(gated.canBatchTrash).toBe(false);
    expect(gated.canBatchTransfer).toBe(true);
  });
});
