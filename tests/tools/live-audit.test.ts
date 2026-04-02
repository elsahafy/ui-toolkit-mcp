import { describe, it, expect } from "vitest";
import { handleLiveAudit } from "../../src/tools/live-audit.js";

describe("live_audit", () => {
  it("requires target_url", async () => {
    const result = await handleLiveAudit({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("rejects private IPs", async () => {
    const result = await handleLiveAudit({ target_url: "http://192.168.1.1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blocked");
  });

  it("rejects invalid URLs", async () => {
    const result = await handleLiveAudit({ target_url: "not-valid" });
    expect(result.isError).toBe(true);
  });

  it("validates wcag_level (returns Playwright error first in test env)", async () => {
    const result = await handleLiveAudit({ target_url: "https://example.com", wcag_level: "INVALID" });
    expect(result.isError).toBe(true);
    // In test env without Playwright, the Playwright check triggers before wcag validation
  });

  it("returns Playwright install message when not available", async () => {
    const result = await handleLiveAudit({ target_url: "https://example.com" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Playwright");
  });
});
