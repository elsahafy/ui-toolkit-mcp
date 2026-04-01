import { describe, it, expect } from "vitest";
import { handleAuditComponent } from "../../src/tools/audit-component.js";

describe("audit_component", () => {
  it("requires markup", async () => {
    const result = await handleAuditComponent({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("audits all categories by default", async () => {
    const result = await handleAuditComponent({
      markup: '<img src="x.jpg"><div style="width: 500px; font-size: 14px">Content</div>',
    });
    const report = JSON.parse(result.content[0].text);
    expect(report.categories).toContain("accessibility");
    expect(report.categories).toContain("performance");
    expect(report.categories).toContain("responsive");
  });

  it("filters by category", async () => {
    const result = await handleAuditComponent({
      markup: '<img src="x.jpg">',
      categories: ["accessibility"],
    });
    const report = JSON.parse(result.content[0].text);
    expect(report.categories).toEqual(["accessibility"]);
    expect(report.findings.every((f: { category: string }) => f.category === "accessibility")).toBe(true);
  });

  it("calculates score correctly", async () => {
    const result = await handleAuditComponent({ markup: "<div>Clean markup</div>" });
    const report = JSON.parse(result.content[0].text);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  it("deducts for critical findings", async () => {
    const result = await handleAuditComponent({
      markup: '<img src="x.jpg"><input type="text"><button></button>',
    });
    const report = JSON.parse(result.content[0].text);
    expect(report.score).toBeLessThan(100);
    expect(report.summary.critical).toBeGreaterThan(0);
  });

  it("uses specified wcag_level", async () => {
    const result = await handleAuditComponent({
      markup: '<input autofocus type="text">',
      wcag_level: "AAA",
    });
    const report = JSON.parse(result.content[0].text);
    expect(report.findings.some((f: { id: string }) => f.id === "a11y-autofocus")).toBe(true);
  });

  it("enforces maxLength", async () => {
    const result = await handleAuditComponent({ markup: "x".repeat(200001) });
    expect(result.isError).toBe(true);
  });

  it("sets component name in report", async () => {
    const result = await handleAuditComponent({ markup: "<div>OK</div>", component_name: "MyCard" });
    const report = JSON.parse(result.content[0].text);
    expect(report.componentName).toBe("MyCard");
  });
});
