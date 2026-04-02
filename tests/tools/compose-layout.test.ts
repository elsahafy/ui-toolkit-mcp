import { describe, it, expect, beforeEach } from "vitest";
import { handleComposeLayout } from "../../src/tools/compose-layout.js";
import { registerComponent, clearRegistry } from "../../src/lib/component-registry.js";

describe("compose_layout", () => {
  beforeEach(() => {
    clearRegistry();
    registerComponent({
      name: "Hero", framework: "react", markup: "<div>Hero</div>",
      tokensUsed: [], auditScore: 100, timestamp: new Date().toISOString(),
    });
    registerComponent({
      name: "Footer", framework: "react", markup: "<div>Footer</div>",
      tokensUsed: [], auditScore: 100, timestamp: new Date().toISOString(),
    });
  });

  it("requires component_names and framework", async () => {
    const result = await handleComposeLayout({});
    expect(result.isError).toBe(true);
  });

  it("validates framework", async () => {
    const result = await handleComposeLayout({
      component_names: ["Hero"], framework: "invalid",
    });
    expect(result.isError).toBe(true);
  });

  it("composes React layout from registry", async () => {
    const result = await handleComposeLayout({
      component_names: ["Hero", "Footer"], framework: "react",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Hero");
    expect(result.content[0].text).toContain("Footer");
    expect(result.content[0].text).toContain("import");
    expect(result.content[0].text).toContain("skip-link");
  });

  it("composes Vue layout", async () => {
    clearRegistry();
    registerComponent({
      name: "Hero", framework: "vue", markup: "<div>Hero</div>",
      tokensUsed: [], auditScore: 100, timestamp: new Date().toISOString(),
    });
    const result = await handleComposeLayout({
      component_names: ["Hero"], framework: "vue",
    });
    expect(result.content[0].text).toContain("<script setup");
  });

  it("handles missing components gracefully", async () => {
    const result = await handleComposeLayout({
      component_names: ["Hero", "NonExistent"], framework: "react",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("1 missing");
    expect(result.content[0].text).toContain("NonExistent");
  });

  it("errors when all components missing", async () => {
    clearRegistry();
    const result = await handleComposeLayout({
      component_names: ["Missing1", "Missing2"], framework: "react",
    });
    expect(result.isError).toBe(true);
  });
});
