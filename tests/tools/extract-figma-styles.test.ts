import { describe, it, expect } from "vitest";
import { handleExtractFigmaStyles } from "../../src/tools/extract-figma-styles.js";

describe("extract_figma_styles", () => {
  it("requires figma_file_key and figma_pat", async () => {
    const result = await handleExtractFigmaStyles({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("validates file key format", async () => {
    const result = await handleExtractFigmaStyles({
      figma_file_key: "invalid key with spaces!",
      figma_pat: "test-pat",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid figma_file_key");
  });

  it("enforces maxLength on figma_file_key", async () => {
    const result = await handleExtractFigmaStyles({
      figma_file_key: "a".repeat(101),
      figma_pat: "test-pat",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum");
  });

  it("enforces maxLength on figma_pat", async () => {
    const result = await handleExtractFigmaStyles({
      figma_file_key: "validKey123",
      figma_pat: "x".repeat(501),
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum");
  });

  it("validates merge_strategy", async () => {
    const result = await handleExtractFigmaStyles({
      figma_file_key: "validKey123",
      figma_pat: "test-pat",
      merge_strategy: "invalid",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid merge_strategy");
  });

  // Note: actual Figma API calls are not tested here (would need fetch mocking)
  // The handler will fail with a network error, which is expected
  it("handles Figma API network errors gracefully", async () => {
    const result = await handleExtractFigmaStyles({
      figma_file_key: "testKey123",
      figma_pat: "figd_test_fake_token",
    });
    expect(result.isError).toBe(true);
    // Should not contain the PAT in the error message
    expect(result.content[0].text).not.toContain("figd_test_fake_token");
  });
});
