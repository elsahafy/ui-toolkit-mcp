import { describe, it, expect } from "vitest";
import { runResponsiveAudit } from "../../src/lib/responsive-rules.js";

describe("responsive-rules", () => {
  it("detects fixed pixel widths", () => {
    const findings = runResponsiveAudit('<div style="width: 500px">Content</div>');
    expect(findings.some((f) => f.id === "resp-fixed-width")).toBe(true);
  });

  it("passes relative widths", () => {
    const findings = runResponsiveAudit('<div style="width: 100%; max-width: 500px">Content</div>');
    expect(findings.some((f) => f.id === "resp-fixed-width")).toBe(false);
  });

  it("detects missing viewport meta", () => {
    const findings = runResponsiveAudit("<html><head></head><body>Test</body></html>");
    expect(findings.some((f) => f.id === "resp-no-viewport")).toBe(true);
  });

  it("passes with viewport meta", () => {
    const findings = runResponsiveAudit('<html><head><meta name="viewport" content="width=device-width"></head><body>Test</body></html>');
    expect(findings.some((f) => f.id === "resp-no-viewport")).toBe(false);
  });

  it("detects px font sizes", () => {
    const findings = runResponsiveAudit('<p style="font-size: 16px">Text</p>');
    expect(findings.some((f) => f.id === "resp-px-font-size")).toBe(true);
  });

  it("passes rem font sizes", () => {
    const findings = runResponsiveAudit('<p style="font-size: 1rem">Text</p>');
    expect(findings.some((f) => f.id === "resp-px-font-size")).toBe(false);
  });

  it("returns findings with correct category", () => {
    const findings = runResponsiveAudit('<div style="width: 500px">Content</div>');
    for (const f of findings) {
      expect(f.category).toBe("responsive");
    }
  });
});
