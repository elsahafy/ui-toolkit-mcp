import { describe, it, expect, beforeEach } from "vitest";
import { generateComponentMarkup } from "../../src/lib/framework-templates.js";
import { setTokens, clearTokens } from "../../src/lib/token-store.js";
import type { NormalizedToken } from "../../src/lib/types.js";

const baseParams = {
  componentName: "TestCard",
  description: "A test card component",
  variant: "default" as const,
  size: "md" as const,
  tokens: new Map<string, NormalizedToken>(),
  includeStyles: true,
  responsive: true,
  includeTests: false,
};

describe("generateComponentMarkup", () => {
  beforeEach(() => clearTokens());

  it("generates React output", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "react" });
    expect(output.framework).toBe("react");
    expect(output.markup).toContain("function TestCard");
    expect(output.styles).toContain(".test-card");
  });

  it("generates Vue output", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "vue" });
    expect(output.framework).toBe("vue");
    expect(output.markup).toContain("<script setup");
  });

  it("generates Svelte output", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "svelte" });
    expect(output.framework).toBe("svelte");
    expect(output.markup).toContain("<script lang=\"ts\">");
  });

  it("generates Angular output", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "angular" });
    expect(output.framework).toBe("angular");
    expect(output.markup).toContain("@Component");
  });

  it("generates Web Component output", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "web-components" });
    expect(output.framework).toBe("web-components");
    expect(output.markup).toContain("HTMLElement");
  });

  it("applies variant styles", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "react", variant: "elevated" });
    expect(output.styles).toContain("box-shadow");
  });

  it("tracks used tokens correctly", () => {
    const token: NormalizedToken = {
      name: "primary", cssVariable: "--color-primary", value: "#3b82f6",
      type: "color", category: "color", description: "",
    };
    const tokens = new Map([["--color-primary", token]]);
    const output = generateComponentMarkup({ ...baseParams, framework: "react", tokens });
    expect(output.tokensUsed).toContain("--color-primary");
  });

  it("returns empty tokensUsed when no tokens loaded", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "react" });
    expect(output.tokensUsed).toHaveLength(0);
  });

  it("includes responsive media query", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "react", responsive: true });
    expect(output.styles).toContain("@media");
  });

  it("excludes responsive when disabled", () => {
    const output = generateComponentMarkup({ ...baseParams, framework: "react", responsive: false });
    expect(output.styles).not.toContain("@media");
  });
});
