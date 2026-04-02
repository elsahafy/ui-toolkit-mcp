import { describe, it, expect, beforeEach } from "vitest";
import { handleExportTokens } from "../../src/tools/export-tokens.js";
import { setTokens, clearTokens } from "../../src/lib/token-store.js";
import type { NormalizedToken } from "../../src/lib/types.js";

const token: NormalizedToken = {
  name: "color-primary", cssVariable: "--color-primary", value: "#3b82f6",
  type: "color", category: "color", description: "Primary color",
};

describe("export_tokens", () => {
  beforeEach(() => clearTokens());

  it("errors when no tokens loaded", async () => {
    const result = await handleExportTokens({ format: "css" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No design tokens");
  });

  it("exports as CSS", async () => {
    setTokens(new Map([["--color-primary", token]]));
    const result = await handleExportTokens({ format: "css" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain(":root {");
    expect(result.content[0].text).toContain("--color-primary: #3b82f6");
  });

  it("exports as JSON", async () => {
    setTokens(new Map([["--color-primary", token]]));
    const result = await handleExportTokens({ format: "json" });
    expect(result.content[0].text).toContain("#3b82f6");
  });

  it("exports as Style Dictionary", async () => {
    setTokens(new Map([["--color-primary", token]]));
    const result = await handleExportTokens({ format: "style-dictionary" });
    expect(result.content[0].text).toContain("color");
    expect(result.content[0].text).toContain("primary");
  });

  it("rejects invalid format", async () => {
    setTokens(new Map([["--color-primary", token]]));
    const result = await handleExportTokens({ format: "invalid" });
    expect(result.isError).toBe(true);
  });

  it("defaults to CSS format", async () => {
    setTokens(new Map([["--color-primary", token]]));
    const result = await handleExportTokens({});
    expect(result.content[0].text).toContain(":root {");
  });
});
