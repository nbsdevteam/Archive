import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { queryClient } from "../lib/queryClient";
import { useAuth } from "./useAuth";

vi.mock("../../app/adapter/api/auth.api", () => ({
  authApi: { logout: vi.fn().mockRejectedValue(new Error("network down")) },
}));

describe("useAuth logout", () => {
  it("clears cached server data so the next user cannot see it, even if the API call fails", async () => {
    queryClient.setQueryData(["documents", "list", {}], { pages: [{ data: [{ id: 1 }] }] });
    const { result } = renderHook(() => useAuth());

    await result.current.logout();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
