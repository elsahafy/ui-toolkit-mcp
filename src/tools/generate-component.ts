import type { ToolResponse, Framework, Variant, Size } from "../lib/types.js";
import { getTokens } from "../lib/token-store.js";
import { generateComponentMarkup } from "../lib/framework-templates.js";
import { validateMaxLength, validateIdentifier } from "../lib/validation.js";

const FRAMEWORKS = new Set(["react", "vue", "svelte", "angular", "web-components"]);
const VARIANTS = new Set(["default", "outlined", "filled", "ghost", "elevated"]);
const SIZES = new Set(["sm", "md", "lg", "xl"]);

export async function handleGenerateComponent(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const description = args.description as string | undefined;
  const framework = args.framework as string | undefined;
  const componentName = args.component_name as string | undefined;

  if (!description || !framework || !componentName) {
    return error("Missing required parameters: description, framework, component_name");
  }

  const descErr = validateMaxLength(description, 2000, "description");
  if (descErr) return error(descErr);

  const nameErr = validateIdentifier(componentName);
  if (nameErr) return error(nameErr);

  if (!FRAMEWORKS.has(framework)) {
    return error(`Invalid framework: ${framework}. Must be one of: ${[...FRAMEWORKS].join(", ")}`);
  }

  const variant = ((args.variant as string) || "default") as Variant;
  if (!VARIANTS.has(variant)) {
    return error(`Invalid variant: ${variant}. Must be one of: ${[...VARIANTS].join(", ")}`);
  }

  const size = ((args.size as string) || "md") as Size;
  if (!SIZES.has(size)) {
    return error(`Invalid size: ${size}. Must be one of: ${[...SIZES].join(", ")}`);
  }

  const includeStyles = args.include_styles !== false;
  const includeTests = args.include_tests === true;
  const responsive = args.responsive !== false;

  const output = generateComponentMarkup({
    framework: framework as Framework,
    componentName,
    description,
    variant,
    size,
    tokens: getTokens(),
    includeStyles,
    responsive,
    includeTests,
  });

  const parts: string[] = [];

  parts.push(`## ${output.componentName} (${output.framework})\n`);
  parts.push("### Component\n```" + fileExt(output.framework) + "\n" + output.markup + "\n```\n");

  if (output.styles) {
    parts.push("### Styles\n```css\n" + output.styles + "\n```\n");
  }

  if (output.test) {
    parts.push("### Test\n```tsx\n" + output.test + "\n```\n");
  }

  if (output.tokensUsed.length > 0) {
    parts.push(`### Design Tokens Used\n${output.tokensUsed.map((t) => `- \`${t}\``).join("\n")}\n`);
  }

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function fileExt(framework: Framework): string {
  switch (framework) {
    case "react": return "tsx";
    case "vue": return "vue";
    case "svelte": return "svelte";
    case "angular": return "typescript";
    case "web-components": return "typescript";
  }
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
