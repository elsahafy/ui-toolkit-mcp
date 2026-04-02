import { describe, it, expect } from "vitest";
import { handleAutoFixComponent } from "../../src/tools/auto-fix-component.js";

describe("auto_fix_component", () => {
  it("requires markup", async () => {
    const result = await handleAutoFixComponent({});
    expect(result.isError).toBe(true);
  });

  it("requires findings array", async () => {
    const result = await handleAutoFixComponent({ markup: "<div>Test</div>" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("findings");
  });

  it("adds alt to images", async () => {
    const result = await handleAutoFixComponent({
      markup: '<img src="photo.jpg">',
      findings: [{ id: "a11y-img-alt", severity: "critical", category: "accessibility", message: "Missing alt", suggestion: "Add alt", confidence: 0.85 }],
    });
    expect(result.content[0].text).toContain('alt=""');
    expect(result.content[0].text).toContain("1 fixes applied");
  });

  it("adds lang to html", async () => {
    const result = await handleAutoFixComponent({
      markup: "<html><body>Test</body></html>",
      findings: [{ id: "a11y-html-lang", severity: "major", category: "accessibility", message: "Missing lang", suggestion: "Add lang", confidence: 0.85 }],
    });
    expect(result.content[0].text).toContain('lang="en"');
  });

  it("adds lazy loading to images", async () => {
    const result = await handleAutoFixComponent({
      markup: '<img src="photo.jpg" alt="Photo">',
      findings: [{ id: "perf-img-no-lazy", severity: "major", category: "performance", message: "No lazy", suggestion: "Add lazy", confidence: 0.8 }],
    });
    expect(result.content[0].text).toContain('loading="lazy"');
  });

  it("converts px font-size to rem", async () => {
    const result = await handleAutoFixComponent({
      markup: '<p style="font-size: 16px">Text</p>',
      findings: [{ id: "resp-px-font-size", severity: "major", category: "responsive", message: "px font", suggestion: "Use rem", confidence: 0.75 }],
    });
    expect(result.content[0].text).toContain("1rem");
  });

  it("reports unfixable findings", async () => {
    const result = await handleAutoFixComponent({
      markup: "<div>Test</div>",
      findings: [{ id: "a11y-heading-hierarchy", severity: "major", category: "accessibility", message: "Bad headings", suggestion: "Fix", confidence: 0.85 }],
    });
    expect(result.content[0].text).toContain("Manual Fixes Needed");
    expect(result.content[0].text).toContain("0 fixes applied");
  });

  it("enforces maxLength", async () => {
    const result = await handleAutoFixComponent({
      markup: "x".repeat(200001),
      findings: [{ id: "a11y-img-alt", severity: "critical", category: "accessibility", message: "test", suggestion: "test", confidence: 0.85 }],
    });
    expect(result.isError).toBe(true);
  });
});
