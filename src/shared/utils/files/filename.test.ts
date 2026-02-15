import { describe, it, expect } from "vitest";
import { getBaseName, toFolderCode } from "./filename";

describe("getBaseName", () => {
  it("strips extension from simple filename", () => {
    expect(getBaseName("report.pdf")).toBe("report");
  });

  it("handles multiple dots (keeps last segment as extension)", () => {
    expect(getBaseName("report.final.pdf")).toBe("report.final");
  });

  it("returns full string when no extension", () => {
    expect(getBaseName("noext")).toBe("noext");
  });

  it("returns empty string for empty input", () => {
    expect(getBaseName("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(getBaseName("  doc.docx  ")).toBe("doc");
  });
});

describe("toFolderCode", () => {
  it("lowercases and replaces spaces with underscore", () => {
    expect(toFolderCode("My Document")).toBe("my_document");
  });

  it("strips special characters to underscore", () => {
    expect(toFolderCode("Report (2024)")).toBe("report_2024");
  });

  it("collapses multiple underscores", () => {
    expect(toFolderCode("a   b")).toBe("a_b");
  });

  it("trims leading/trailing underscores", () => {
    expect(toFolderCode("  x  ")).toBe("x");
  });

  it("returns empty string for empty input", () => {
    expect(toFolderCode("")).toBe("");
  });
});
