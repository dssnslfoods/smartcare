import { describe, it, expect } from "vitest";
import { parseCallCount, MAX_CALL_COUNT } from "@/lib/callCount";

describe("parseCallCount", () => {
  it("accepts whole numbers from 1", () => {
    expect(parseCallCount("1")).toBe(1);
    expect(parseCallCount(" 16 ")).toBe(16);
    expect(parseCallCount(14)).toBe(14);
    expect(parseCallCount("1,200")).toBe(1200);
  });

  it("rejects blank, zero, negative, fractional and non-numeric input", () => {
    for (const v of ["", "  ", "0", "-3", "1.5", "abc", "1e2", null, undefined]) {
      expect(parseCallCount(v as string | null | undefined)).toBeNull();
    }
  });

  it("rejects values above the max", () => {
    expect(parseCallCount(String(MAX_CALL_COUNT))).toBe(MAX_CALL_COUNT);
    expect(parseCallCount(String(MAX_CALL_COUNT + 1))).toBeNull();
  });
});
