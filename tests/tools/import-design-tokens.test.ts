import { describe, it, expect, beforeEach } from "vitest";
import { handleImportDesignTokens } from "../../src/tools/import-design-tokens.js";
import { clearTokens, getTokenCount } from "../../src/lib/token-store.js";

describe("import_design_tokens", () => {
  beforeEach(() => clearTokens());

  it("requires tokens_json and format", async () => {
    const result = await handleImportDesignTokens({});
    expect(result.isError).toBe(true);
  });

  it("rejects invalid format", async () => {
    const result = await handleImportDesignTokens({
      tokens_json: "{}", format: "invalid",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid format");
  });

  it("rejects invalid JSON", async () => {
    const result = await handleImportDesignTokens({
      tokens_json: "not json", format: "css-custom-properties",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid JSON");
  });

  it("imports CSS custom properties", async () => {
    const tokens = JSON.stringify({ "--color-primary": "#3b82f6", "--spacing-md": "1rem" });
    const result = await handleImportDesignTokens({ tokens_json: tokens, format: "css-custom-properties" });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.imported).toBe(2);
    expect(getTokenCount()).toBe(2);
  });

  it("imports Figma tokens format", async () => {
    const tokens = JSON.stringify({
      colors: { primary: { value: "#3b82f6", type: "color" } },
    });
    const result = await handleImportDesignTokens({ tokens_json: tokens, format: "figma-tokens" });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.imported).toBeGreaterThan(0);
  });

  it("imports Style Dictionary format", async () => {
    const tokens = JSON.stringify({
      properties: { color: { primary: { value: "#3b82f6", type: "color" } } },
    });
    const result = await handleImportDesignTokens({ tokens_json: tokens, format: "style-dictionary" });
    expect(result.isError).toBeUndefined();
  });

  it("applies namespace prefix", async () => {
    const tokens = JSON.stringify({ "--color-primary": "#3b82f6" });
    const result = await handleImportDesignTokens({
      tokens_json: tokens, format: "css-custom-properties", namespace: "brand",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.samples[0].name).toContain("brand");
  });

  it("sanitizes namespace with special chars", async () => {
    const tokens = JSON.stringify({ "--color-primary": "#3b82f6" });
    const result = await handleImportDesignTokens({
      tokens_json: tokens, format: "css-custom-properties", namespace: "my brand!",
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.samples[0].name).not.toContain("!");
    expect(data.samples[0].name).not.toContain(" ");
  });

  it("enforces maxLength on tokens_json", async () => {
    const result = await handleImportDesignTokens({
      tokens_json: "x".repeat(500001), format: "css-custom-properties",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum length");
  });
});
