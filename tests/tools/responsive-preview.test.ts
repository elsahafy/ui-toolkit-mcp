import { describe, it, expect } from "vitest";
import { handleResponsivePreview } from "../../src/tools/responsive-preview.js";

describe("responsive_preview", () => {
  it("requires target_url", async () => {
    const result = await handleResponsivePreview({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("rejects private IPs", async () => {
    const result = await handleResponsivePreview({ target_url: "http://10.0.0.1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("rejects non-http schemes", async () => {
    const result = await handleResponsivePreview({ target_url: "file:///etc/passwd" });
    expect(result.isError).toBe(true);
  });

  it("enforces maxLength", async () => {
    const result = await handleResponsivePreview({ target_url: "http://" + "x".repeat(2050) + ".com" });
    expect(result.isError).toBe(true);
  });

  it("returns Playwright install message when not available", async () => {
    const result = await handleResponsivePreview({ target_url: "https://example.com" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Playwright");
  });
});
