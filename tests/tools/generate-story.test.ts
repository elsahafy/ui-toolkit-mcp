import { describe, it, expect } from "vitest";
import { handleGenerateStory } from "../../src/tools/generate-story.js";

const REACT_COMPONENT = `
interface ButtonProps {
  label: string;
  disabled?: boolean;
}
export function Button({ label, disabled }: ButtonProps) {
  return <button disabled={disabled}>{label}</button>;
}`;

describe("generate_story", () => {
  it("requires component_code, framework, component_name", async () => {
    const result = await handleGenerateStory({});
    expect(result.isError).toBe(true);
  });

  it("validates framework enum", async () => {
    const result = await handleGenerateStory({
      component_code: REACT_COMPONENT, framework: "invalid", component_name: "Button",
    });
    expect(result.isError).toBe(true);
  });

  it("validates component_name as identifier", async () => {
    const result = await handleGenerateStory({
      component_code: REACT_COMPONENT, framework: "react", component_name: "my button",
    });
    expect(result.isError).toBe(true);
  });

  it("generates React story with detected props", async () => {
    const result = await handleGenerateStory({
      component_code: REACT_COMPONENT, framework: "react", component_name: "Button",
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("Detected Props");
    expect(text).toContain("label");
    expect(text).toContain("disabled");
    expect(text).toContain("@storybook/react");
    expect(text).toContain("export const Default");
  });

  it("uses custom story_title", async () => {
    const result = await handleGenerateStory({
      component_code: REACT_COMPONENT, framework: "react",
      component_name: "Button", story_title: "UI/Button",
    });
    expect(result.content[0].text).toContain("UI/Button");
  });

  it("handles component with no detectable props", async () => {
    const result = await handleGenerateStory({
      component_code: "export function Icon() { return <svg />; }",
      framework: "react", component_name: "Icon",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("No props detected");
  });

  it("enforces maxLength on component_code", async () => {
    const result = await handleGenerateStory({
      component_code: "x".repeat(200001), framework: "react", component_name: "Button",
    });
    expect(result.isError).toBe(true);
  });
});
