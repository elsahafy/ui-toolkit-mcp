import type { ToolResponse, StoryFramework } from "../lib/types.js";
import { detectProps, buildStoryCSF3 } from "../lib/story-templates.js";
import { validateMaxLength, validateIdentifier } from "../lib/validation.js";

const FRAMEWORKS = new Set(["react", "vue", "svelte", "angular"]);

export async function handleGenerateStory(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const componentCode = args.component_code as string | undefined;
  const framework = args.framework as string | undefined;
  const componentName = args.component_name as string | undefined;

  if (!componentCode || !framework || !componentName) {
    return error("Missing required parameters: component_code, framework, component_name");
  }

  const codeErr = validateMaxLength(componentCode, 200000, "component_code");
  if (codeErr) return error(codeErr);

  const nameErr = validateIdentifier(componentName);
  if (nameErr) return error(nameErr);

  if (!FRAMEWORKS.has(framework)) {
    return error(`Invalid framework: ${framework}. Must be one of: ${[...FRAMEWORKS].join(", ")}`);
  }

  const storyTitle = (args.story_title as string) || `Components/${componentName}`;
  const fw = framework as StoryFramework;

  const detectedProps = detectProps(componentCode, fw);
  const storyCode = buildStoryCSF3({
    componentName,
    framework: fw,
    storyTitle,
    detectedProps,
  });

  const ext = fw === "react" ? "tsx" : fw === "vue" ? "ts" : fw === "svelte" ? "ts" : "ts";
  const parts: string[] = [];

  parts.push(`## Storybook Story: ${componentName} (${fw})\n`);

  if (detectedProps.length > 0) {
    parts.push("### Detected Props");
    for (const p of detectedProps) {
      const req = p.required ? "required" : "optional";
      const def = p.defaultValue ? `, default: \`${p.defaultValue}\`` : "";
      parts.push(`- \`${p.name}\` (${p.type}, ${req}${def})`);
    }
    parts.push("");
  } else {
    parts.push("### Detected Props\nNo props detected. Story generated with minimal args.\n");
  }

  parts.push(`### Story File (\`${componentName}.stories.${ext}\`)`);
  parts.push("```" + ext + "\n" + storyCode + "\n```");

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
