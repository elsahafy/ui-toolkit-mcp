import type { StoryFramework, DetectedProp } from "./types.js";

// ========================================
// PROP DETECTION (REGEX-BASED)
// ========================================

export function detectProps(code: string, framework: StoryFramework): DetectedProp[] {
  switch (framework) {
    case "react": return detectReactProps(code);
    case "vue": return detectVueProps(code);
    case "svelte": return detectSvelteProps(code);
    case "angular": return detectAngularProps(code);
  }
}

function detectReactProps(code: string): DetectedProp[] {
  const props: DetectedProp[] = [];
  const interfaceMatch = code.match(/interface\s+\w+Props\s*\{([^}]+)\}/s);
  if (!interfaceMatch) return props;

  const body = interfaceMatch[1];
  const lineRe = /(\w+)(\?)?:\s*([^;\n]+)/g;
  let m;
  while ((m = lineRe.exec(body)) !== null) {
    props.push({
      name: m[1],
      type: m[3].trim(),
      defaultValue: "",
      required: !m[2],
    });
  }
  return props;
}

function detectVueProps(code: string): DetectedProp[] {
  const props: DetectedProp[] = [];
  const tsMatch = code.match(/defineProps<\{([^}]+)\}>/s);
  if (tsMatch) {
    const lineRe = /(\w+)(\?)?:\s*([^;\n]+)/g;
    let m;
    while ((m = lineRe.exec(tsMatch[1])) !== null) {
      props.push({ name: m[1], type: m[3].trim(), defaultValue: "", required: !m[2] });
    }
  }
  return props;
}

function detectSvelteProps(code: string): DetectedProp[] {
  const props: DetectedProp[] = [];
  const re = /export\s+let\s+(\w+)(?::\s*([^=;\n]+))?(?:\s*=\s*([^;\n]+))?/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    props.push({
      name: m[1],
      type: m[2]?.trim() || "unknown",
      defaultValue: m[3]?.trim() || "",
      required: !m[3],
    });
  }
  return props;
}

function detectAngularProps(code: string): DetectedProp[] {
  const props: DetectedProp[] = [];
  const re = /@Input\(\)\s+(\w+)(?::\s*([^=;\n]+))?(?:\s*=\s*([^;\n]+))?/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    props.push({
      name: m[1],
      type: m[2]?.trim() || "unknown",
      defaultValue: m[3]?.trim() || "",
      required: !m[3],
    });
  }
  return props;
}

// ========================================
// CSF3 STORY GENERATION
// ========================================

interface StoryParams {
  componentName: string;
  framework: StoryFramework;
  storyTitle: string;
  detectedProps: readonly DetectedProp[];
}

export function buildStoryCSF3(params: StoryParams): string {
  switch (params.framework) {
    case "react": return buildReactStory(params);
    case "vue": return buildVueStory(params);
    case "svelte": return buildSvelteStory(params);
    case "angular": return buildAngularStory(params);
  }
}

function buildArgTypes(props: readonly DetectedProp[]): string {
  if (props.length === 0) return "{}";
  const entries = props.map((p) => {
    const control = inferControl(p.type);
    return `    ${p.name}: { control: "${control}" }`;
  });
  return `{\n${entries.join(",\n")}\n  }`;
}

function buildDefaultArgs(props: readonly DetectedProp[]): string {
  if (props.length === 0) return "{}";
  const entries = props
    .filter((p) => p.defaultValue || !p.required)
    .map((p) => `    ${p.name}: ${p.defaultValue || inferDefault(p.type)}`);
  if (entries.length === 0) return "{}";
  return `{\n${entries.join(",\n")}\n  }`;
}

function inferControl(type: string): string {
  if (/boolean/i.test(type)) return "boolean";
  if (/number/i.test(type)) return "number";
  if (/\|/.test(type)) return "select";
  return "text";
}

function inferDefault(type: string): string {
  if (/boolean/i.test(type)) return "false";
  if (/number/i.test(type)) return "0";
  if (/React\.ReactNode|ReactNode|string/i.test(type)) return '"Example"';
  return '""';
}

function buildReactStory(p: StoryParams): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { ${p.componentName} } from "./${p.componentName}";

const meta = {
  title: "${p.storyTitle}",
  component: ${p.componentName},
  tags: ["autodocs"],
  argTypes: ${buildArgTypes(p.detectedProps)},
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
} satisfies Meta<typeof ${p.componentName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ${buildDefaultArgs(p.detectedProps)},
};

export const WithPlayFunction: Story = {
  args: ${buildDefaultArgs(p.detectedProps)},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region")).toBeInTheDocument();
  },
};`;
}

function buildVueStory(p: StoryParams): string {
  return `import type { Meta, StoryObj } from "@storybook/vue3";
import ${p.componentName} from "./${p.componentName}.vue";

const meta = {
  title: "${p.storyTitle}",
  component: ${p.componentName},
  tags: ["autodocs"],
  argTypes: ${buildArgTypes(p.detectedProps)},
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
} satisfies Meta<typeof ${p.componentName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ${buildDefaultArgs(p.detectedProps)},
};`;
}

function buildSvelteStory(p: StoryParams): string {
  return `import type { Meta, StoryObj } from "@storybook/svelte";
import ${p.componentName} from "./${p.componentName}.svelte";

const meta = {
  title: "${p.storyTitle}",
  component: ${p.componentName},
  tags: ["autodocs"],
  argTypes: ${buildArgTypes(p.detectedProps)},
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
} satisfies Meta<typeof ${p.componentName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ${buildDefaultArgs(p.detectedProps)},
};`;
}

function buildAngularStory(p: StoryParams): string {
  return `import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ${p.componentName}Component } from "./${p.componentName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}.component";

const meta = {
  title: "${p.storyTitle}",
  component: ${p.componentName}Component,
  tags: ["autodocs"],
  decorators: [
    moduleMetadata({ imports: [${p.componentName}Component] }),
  ],
  argTypes: ${buildArgTypes(p.detectedProps)},
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
} satisfies Meta<${p.componentName}Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ${buildDefaultArgs(p.detectedProps)},
};`;
}
