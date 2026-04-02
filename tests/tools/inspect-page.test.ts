import { describe, it, expect } from "vitest";
import { handleInspectPage } from "../../src/tools/inspect-page.js";

describe("inspect_page", () => {
  it("requires target_url", async () => {
    const result = await handleInspectPage({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("rejects private IPs", async () => {
    const result = await handleInspectPage({ target_url: "http://127.0.0.1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("rejects non-http schemes", async () => {
    const result = await handleInspectPage({ target_url: "ftp://example.com" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Only http://");
  });

  it("rejects invalid URLs", async () => {
    const result = await handleInspectPage({ target_url: "not-a-url" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid URL");
  });

  it("enforces maxLength on target_url", async () => {
    const result = await handleInspectPage({ target_url: "http://" + "a".repeat(2050) + ".com" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum");
  });

  it("returns install message when Playwright not available", async () => {
    // Playwright is not installed in test env
    const result = await handleInspectPage({ target_url: "https://example.com" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Playwright");
  });
});
