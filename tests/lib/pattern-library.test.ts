import { describe, it, expect } from "vitest";
import { getComponentPatterns } from "../../src/lib/pattern-library.js";

describe("pattern-library", () => {
  it("returns an object with patterns array", () => {
    const result = getComponentPatterns() as { patterns: unknown[] };
    expect(result.patterns).toBeDefined();
    expect(Array.isArray(result.patterns)).toBe(true);
  });

  it("contains 12 patterns", () => {
    const result = getComponentPatterns() as { patterns: unknown[] };
    expect(result.patterns.length).toBe(12);
  });

  it("each pattern has required fields", () => {
    const result = getComponentPatterns() as { patterns: { name: string; description: string; variants: string[]; accessibility: string[]; commonProps: string[]; structure: string }[] };
    for (const pattern of result.patterns) {
      expect(pattern.name).toBeTruthy();
      expect(pattern.description).toBeTruthy();
      expect(Array.isArray(pattern.variants)).toBe(true);
      expect(Array.isArray(pattern.accessibility)).toBe(true);
      expect(Array.isArray(pattern.commonProps)).toBe(true);
      expect(pattern.structure).toBeTruthy();
    }
  });

  it("includes common component types", () => {
    const result = getComponentPatterns() as { patterns: { name: string }[] };
    const names = result.patterns.map((p) => p.name);
    expect(names).toContain("Button");
    expect(names).toContain("Card");
    expect(names).toContain("Modal");
    expect(names).toContain("Form");
    expect(names).toContain("Navigation");
  });
});
