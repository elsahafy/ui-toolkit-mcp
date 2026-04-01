import { describe, it, expect } from "vitest";
import { runPerformanceAudit } from "../../src/lib/performance-rules.js";

describe("performance-rules", () => {
  it("detects images without lazy loading", () => {
    const findings = runPerformanceAudit('<img src="photo.jpg">');
    expect(findings.some((f) => f.id === "perf-img-no-lazy")).toBe(true);
  });

  it("passes images with lazy loading", () => {
    const findings = runPerformanceAudit('<img src="photo.jpg" loading="lazy">');
    expect(findings.some((f) => f.id === "perf-img-no-lazy")).toBe(false);
  });

  it("detects images without dimensions", () => {
    const findings = runPerformanceAudit('<img src="photo.jpg" loading="lazy">');
    expect(findings.some((f) => f.id === "perf-img-no-dimensions")).toBe(true);
  });

  it("passes images with width and height", () => {
    const findings = runPerformanceAudit('<img src="photo.jpg" width="200" height="100">');
    expect(findings.some((f) => f.id === "perf-img-no-dimensions")).toBe(false);
  });

  it("detects inline scripts", () => {
    const findings = runPerformanceAudit("<script>alert(1)</script>");
    expect(findings.some((f) => f.id === "perf-inline-script")).toBe(true);
  });

  it("passes external scripts", () => {
    const findings = runPerformanceAudit('<script src="app.js"></script>');
    expect(findings.some((f) => f.id === "perf-inline-script")).toBe(false);
  });

  it("detects large inline SVGs", () => {
    const largeSvg = `<svg>${"<rect />".repeat(1000)}</svg>`;
    const findings = runPerformanceAudit(largeSvg);
    expect(findings.some((f) => f.id === "perf-large-svg")).toBe(true);
  });

  it("returns findings with correct category", () => {
    const findings = runPerformanceAudit('<img src="x.jpg">');
    for (const f of findings) {
      expect(f.category).toBe("performance");
    }
  });
});
