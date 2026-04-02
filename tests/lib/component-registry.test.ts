import { describe, it, expect, beforeEach } from "vitest";
import { registerComponent, getComponent, listComponents, getComponentCount, clearRegistry, getRegistryAsJSON } from "../../src/lib/component-registry.js";

describe("component-registry", () => {
  beforeEach(() => clearRegistry());

  const component = {
    name: "Card",
    framework: "react" as const,
    markup: "<div>Card</div>",
    tokensUsed: ["--color-primary"],
    auditScore: 85,
    timestamp: "2026-01-01T00:00:00.000Z",
  };

  it("starts empty", () => {
    expect(getComponentCount()).toBe(0);
    expect(listComponents()).toHaveLength(0);
  });

  it("registers and retrieves a component", () => {
    registerComponent(component);
    expect(getComponentCount()).toBe(1);
    expect(getComponent("Card")).toEqual(component);
  });

  it("overwrites existing component with same name", () => {
    registerComponent(component);
    registerComponent({ ...component, auditScore: 95 });
    expect(getComponentCount()).toBe(1);
    expect(getComponent("Card")?.auditScore).toBe(95);
  });

  it("lists all components", () => {
    registerComponent(component);
    registerComponent({ ...component, name: "Button" });
    expect(listComponents()).toHaveLength(2);
  });

  it("clears registry", () => {
    registerComponent(component);
    clearRegistry();
    expect(getComponentCount()).toBe(0);
  });

  it("returns undefined for unknown component", () => {
    expect(getComponent("Unknown")).toBeUndefined();
  });

  it("getRegistryAsJSON includes metadata but not markup", () => {
    registerComponent(component);
    const json = JSON.parse(getRegistryAsJSON());
    expect(json).toHaveLength(1);
    expect(json[0].name).toBe("Card");
    expect(json[0].framework).toBe("react");
    expect(json[0].auditScore).toBe(85);
    expect(json[0].markup).toBeUndefined();
  });
});
