import { describe, it, expect } from "vitest";
import { runAccessibilityAudit } from "../../src/lib/accessibility-rules.js";

describe("accessibility-rules", () => {
  it("detects images without alt text", () => {
    const findings = runAccessibilityAudit('<img src="photo.jpg">');
    expect(findings.some((f) => f.id === "a11y-img-alt")).toBe(true);
  });

  it("passes images with alt text", () => {
    const findings = runAccessibilityAudit('<img src="photo.jpg" alt="A photo">');
    expect(findings.some((f) => f.id === "a11y-img-alt")).toBe(false);
  });

  it("detects inputs without labels", () => {
    const findings = runAccessibilityAudit('<input type="text">');
    expect(findings.some((f) => f.id === "a11y-input-label")).toBe(true);
  });

  it("passes inputs with aria-label", () => {
    const findings = runAccessibilityAudit('<input type="text" aria-label="Name">');
    expect(findings.some((f) => f.id === "a11y-input-label")).toBe(false);
  });

  it("detects skipped heading levels", () => {
    const findings = runAccessibilityAudit("<h1>Title</h1><h3>Subtitle</h3>");
    expect(findings.some((f) => f.id === "a11y-heading-hierarchy")).toBe(true);
  });

  it("passes sequential headings", () => {
    const findings = runAccessibilityAudit("<h1>Title</h1><h2>Subtitle</h2>");
    expect(findings.some((f) => f.id === "a11y-heading-hierarchy")).toBe(false);
  });

  it("detects missing lang on html", () => {
    const findings = runAccessibilityAudit("<html><body>Test</body></html>");
    expect(findings.some((f) => f.id === "a11y-html-lang")).toBe(true);
  });

  it("passes html with lang", () => {
    const findings = runAccessibilityAudit('<html lang="en"><body>Test</body></html>');
    expect(findings.some((f) => f.id === "a11y-html-lang")).toBe(false);
  });

  it("detects empty buttons", () => {
    const findings = runAccessibilityAudit("<button></button>");
    expect(findings.some((f) => f.id === "a11y-button-text")).toBe(true);
  });

  it("detects non-descriptive link text", () => {
    const findings = runAccessibilityAudit('<a href="#">click here</a>');
    expect(findings.some((f) => f.id === "a11y-link-text")).toBe(true);
  });

  it("detects positive tabindex", () => {
    const findings = runAccessibilityAudit('<div tabindex="5">Focus me</div>');
    expect(findings.some((f) => f.id === "a11y-tabindex-positive")).toBe(true);
  });

  it("detects click without keyboard handler on div", () => {
    const findings = runAccessibilityAudit('<div onClick={handleClick}>Click</div>');
    expect(findings.some((f) => f.id === "a11y-onclick-no-keyboard")).toBe(true);
  });

  it("detects autofocus at AAA level", () => {
    const findings = runAccessibilityAudit('<input autofocus type="text">', "AAA");
    expect(findings.some((f) => f.id === "a11y-autofocus")).toBe(true);
  });

  it("skips AAA rules at AA level", () => {
    const findings = runAccessibilityAudit('<input autofocus type="text">', "AA");
    expect(findings.some((f) => f.id === "a11y-autofocus")).toBe(false);
  });

  it("detects aria-hidden on focusable elements", () => {
    const findings = runAccessibilityAudit('<button aria-hidden="true" tabindex="0">X</button>');
    expect(findings.some((f) => f.id === "a11y-no-aria-hidden-focusable")).toBe(true);
  });

  it("returns findings with correct structure", () => {
    const findings = runAccessibilityAudit('<img src="x.jpg">');
    const finding = findings.find((f) => f.id === "a11y-img-alt");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
    expect(finding!.category).toBe("accessibility");
    expect(finding!.wcagCriterion).toBe("1.1.1");
    expect(finding!.suggestion).toBeTruthy();
    expect(finding!.confidence).toBeGreaterThan(0);
  });
});
