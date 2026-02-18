import { describe, it, expect } from "vitest";
import {
  getPaginationPageTokens,
  computeTotalPages,
  ELLIPSIS,
  type PageToken,
} from "./pagination";

describe("getPaginationPageTokens", () => {
  it("returns empty array when totalPages <= 0", () => {
    expect(getPaginationPageTokens(1, 0)).toEqual([]);
    expect(getPaginationPageTokens(1, -1)).toEqual([]);
  });

  it("returns [1] for single page", () => {
    expect(getPaginationPageTokens(1, 1)).toEqual([1]);
  });

  it("returns all pages when count fits without ellipses (e.g. 5 pages)", () => {
    expect(getPaginationPageTokens(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationPageTokens(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns 1 ... window ... last for many pages with current in middle", () => {
    const tokens = getPaginationPageTokens(7, 15);
    expect(tokens).toEqual([1, ELLIPSIS, 6, 7, 8, ELLIPSIS, 15]);
  });

  it("pins first and last; shows window around current", () => {
    expect(getPaginationPageTokens(1, 15)).toEqual([1, 2, 3, 4, ELLIPSIS, 15]);
    expect(getPaginationPageTokens(15, 15)).toEqual([1, ELLIPSIS, 12, 13, 14, 15]);
    expect(getPaginationPageTokens(2, 15)).toEqual([1, 2, 3, 4, ELLIPSIS, 15]);
  });

  it("clamps page to valid range", () => {
    expect(getPaginationPageTokens(0, 10)).toEqual([1, 2, 3, 4, ELLIPSIS, 10]);
    expect(getPaginationPageTokens(100, 10)).toEqual([1, ELLIPSIS, 7, 8, 9, 10]);
  });

  it("works for large total (e.g. 1000+) without rendering 1000 buttons", () => {
    const tokens = getPaginationPageTokens(500, 1000) as PageToken[];
    expect(tokens[0]).toBe(1);
    expect(tokens[tokens.length - 1]).toBe(1000);
    expect(tokens).toContain(ELLIPSIS);
    expect(tokens.filter((t) => t === ELLIPSIS).length).toBeLessThanOrEqual(2);
  });
});

describe("computeTotalPages", () => {
  it("returns 0 for zero or negative total or perPage", () => {
    expect(computeTotalPages(0, 20)).toBe(0);
    expect(computeTotalPages(10, 0)).toBe(0);
    expect(computeTotalPages(-1, 20)).toBe(0);
  });

  it("rounds up partial pages", () => {
    expect(computeTotalPages(25, 20)).toBe(2);
    expect(computeTotalPages(21, 20)).toBe(2);
    expect(computeTotalPages(20, 20)).toBe(1);
  });
});
