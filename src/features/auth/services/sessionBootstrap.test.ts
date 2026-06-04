import { describe, expect, it } from "vitest";
import { normalizeCapabilityPermissions } from "./sessionBootstrap";
import { DEFAULT_CAPABILITY_PERMISSIONS } from "@/shared/types/capabilityPermissions";

describe("normalizeCapabilityPermissions", () => {
  it("returns defaults when source is empty", () => {
    expect(normalizeCapabilityPermissions(null)).toEqual(DEFAULT_CAPABILITY_PERMISSIONS);
  });

  it("normalizes partial API payload", () => {
    expect(
      normalizeCapabilityPermissions({
        can_delete_files: true,
        can_upload_multiple: true,
        upload_limit: 5,
      }),
    ).toEqual({
      can_delete_files: true,
      can_upload_multiple: true,
      upload_limit: 5,
    });
  });

  it("falls back upload_limit to default when invalid", () => {
    expect(
      normalizeCapabilityPermissions({
        can_delete_files: false,
        can_upload_multiple: false,
        upload_limit: 0,
      }).upload_limit,
    ).toBe(DEFAULT_CAPABILITY_PERMISSIONS.upload_limit);
  });
});
