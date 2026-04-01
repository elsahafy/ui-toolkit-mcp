import { describe, it, expect, beforeEach } from "vitest";
import { handleGenerateComponent } from "../../src/tools/generate-component.js";
import { setTokens, clearTokens } from "../../src/lib/token-store.js";
import type { NormalizedToken } from "../../src/lib/types.js";

describe("generate_component", () => {
  beforeEach(() => clearTokens());

  it("requires description, framework, and component_name", async () => {
    const result = await handleGenerateComponent({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("validates framework enum", async () => {
    const result = await handleGenerateComponent({
      description: "A button", framework: "invalid", component_name: "Button",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid framework");
  });

  it("validates component_name is PascalCase", async () => {
    const result = await handleGenerateComponent({
      description: "A button", framework: "react", component_name: "my button",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid identifier");
  });

  it("generates React component", async () => {
    const result = await handleGenerateComponent({
      description: "A card with title", framework: "react", component_name: "Card",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Card");
    expect(result.content[0].text).toContain("react");
  });

  it("generates Vue component", async () => {
    const result = await handleGenerateComponent({
      description: "A card", framework: "vue", component_name: "Card",
    });
    expect(result.content[0].text).toContain("<script setup");
  });

  it("generates Svelte component", async () => {
    const result = await handleGenerateComponent({
      description: "A card", framework: "svelte", component_name: "Card",
    });
    expect(result.content[0].text).toContain("<script lang=\"ts\">");
  });

  it("generates Angular component", async () => {
    const result = await handleGenerateComponent({
      description: "A card", framework: "angular", component_name: "Card",
    });
    expect(result.content[0].text).toContain("@Component");
  });

  it("generates Web Component", async () => {
    const result = await handleGenerateComponent({
      description: "A card", framework: "web-components", component_name: "Card",
    });
    expect(result.content[0].text).toContain("HTMLElement");
  });

  it("includes tokens when loaded", async () => {
    const token: NormalizedToken = {
      name: "primary", cssVariable: "--color-primary", value: "#3b82f6",
      type: "color", category: "color", description: "",
    };
    setTokens(new Map([["--color-primary", token]]));

    const result = await handleGenerateComponent({
      description: "A button", framework: "react", component_name: "Button",
    });
    expect(result.content[0].text).toContain("--color-primary");
    expect(result.content[0].text).toContain("Design Tokens Used");
  });

  it("applies variant styles", async () => {
    const result = await handleGenerateComponent({
      description: "A card", framework: "react", component_name: "Card", variant: "elevated",
    });
    expect(result.content[0].text).toContain("box-shadow");
  });

  it("enforces maxLength on description", async () => {
    const result = await handleGenerateComponent({
      description: "x".repeat(2001), framework: "react", component_name: "Card",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum length");
  });
});
