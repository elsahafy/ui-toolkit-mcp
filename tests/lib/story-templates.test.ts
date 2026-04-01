import { describe, it, expect } from "vitest";
import { detectProps, buildStoryCSF3 } from "../../src/lib/story-templates.js";

describe("detectProps", () => {
  it("detects React props from interface", () => {
    const code = `interface ButtonProps {
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }`;
    const props = detectProps(code, "react");
    expect(props).toHaveLength(3);
    expect(props[0].name).toBe("label");
    expect(props[0].required).toBe(true);
    expect(props[2].name).toBe("disabled");
    expect(props[2].required).toBe(false);
  });

  it("detects Vue props from defineProps", () => {
    const code = `defineProps<{
      title: string;
      count?: number;
    }>()`;
    const props = detectProps(code, "vue");
    expect(props).toHaveLength(2);
    expect(props[0].name).toBe("title");
    expect(props[1].required).toBe(false);
  });

  it("detects Svelte props", () => {
    const code = `export let name: string;
    export let count: number = 0;`;
    const props = detectProps(code, "svelte");
    expect(props).toHaveLength(2);
    expect(props[0].name).toBe("name");
    expect(props[0].required).toBe(true);
    expect(props[1].name).toBe("count");
    expect(props[1].defaultValue).toBe("0");
  });

  it("detects Angular @Input() props", () => {
    const code = `@Input() title: string;
    @Input() size: string = "md";`;
    const props = detectProps(code, "angular");
    expect(props).toHaveLength(2);
    expect(props[0].name).toBe("title");
    expect(props[1].defaultValue).toBe('"md"');
  });

  it("returns empty array for no props", () => {
    expect(detectProps("const x = 1;", "react")).toHaveLength(0);
  });
});

describe("buildStoryCSF3", () => {
  const params = {
    componentName: "Button",
    storyTitle: "Components/Button",
    detectedProps: [
      { name: "label", type: "string", defaultValue: "", required: true },
      { name: "disabled", type: "boolean", defaultValue: "false", required: false },
    ],
  };

  it("generates React story", () => {
    const code = buildStoryCSF3({ ...params, framework: "react" });
    expect(code).toContain("@storybook/react");
    expect(code).toContain("export const Default");
    expect(code).toContain("Components/Button");
    expect(code).toContain("autodocs");
  });

  it("generates Vue story", () => {
    const code = buildStoryCSF3({ ...params, framework: "vue" });
    expect(code).toContain("@storybook/vue3");
  });

  it("generates Svelte story", () => {
    const code = buildStoryCSF3({ ...params, framework: "svelte" });
    expect(code).toContain("@storybook/svelte");
  });

  it("generates Angular story with moduleMetadata", () => {
    const code = buildStoryCSF3({ ...params, framework: "angular" });
    expect(code).toContain("@storybook/angular");
    expect(code).toContain("moduleMetadata");
  });

  it("includes a11y config", () => {
    const code = buildStoryCSF3({ ...params, framework: "react" });
    expect(code).toContain("a11y");
    expect(code).toContain("color-contrast");
  });
});
