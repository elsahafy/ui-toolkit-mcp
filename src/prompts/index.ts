// ========================================
// PROMPT DEFINITIONS
// ========================================

export function getPromptDefinitions() {
  return [
    {
      name: "build_page",
      description:
        "Workflow for generating a full page with multiple components using active design tokens",
      arguments: [
        {
          name: "page_description",
          description: "Description of the page to build (e.g., 'landing page with hero, features, pricing, and footer')",
          required: true,
        },
        {
          name: "framework",
          description: "Target framework: react, vue, svelte, angular, or web-components",
          required: true,
        },
        {
          name: "sections",
          description: "Comma-separated section names (e.g., 'Hero,Features,Pricing,Footer')",
          required: false,
        },
      ],
    },
    {
      name: "component_audit",
      description:
        "Comprehensive audit workflow: analyze markup, report findings, and suggest fixes",
      arguments: [
        {
          name: "markup",
          description: "The component markup to audit",
          required: true,
        },
        {
          name: "component_name",
          description: "Name of the component being audited",
          required: false,
        },
      ],
    },
  ];
}

// ========================================
// PROMPT DISPATCH
// ========================================

export function getPrompt(
  name: string,
  args: Record<string, string>
): { description: string; messages: { role: "user"; content: { type: "text"; text: string } }[] } {
  switch (name) {
    case "build_page":
      return buildPagePrompt(args);
    case "component_audit":
      return componentAuditPrompt(args);
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

function buildPagePrompt(args: Record<string, string>) {
  const pageDescription = args.page_description || "a web page";
  const framework = args.framework || "react";
  const sections = args.sections
    ? args.sections.split(",").map((s) => s.trim())
    : ["Header", "Main Content", "Footer"];

  return {
    description: `Build a ${framework} page: ${pageDescription}`,
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Build a complete ${framework} page: ${pageDescription}

Follow this workflow:

1. **Check design tokens**: Read the ui://tokens/active resource. If tokens are loaded, all generated components must use them.

2. **Generate each section**: Use the generate_component tool for each of these sections:
${sections.map((s, i) => `   ${i + 1}. ${s}`).join("\n")}

   For each component:
   - Set framework to "${framework}"
   - Use descriptive component names (PascalCase)
   - Set responsive: true
   - Set include_styles: true

3. **Compose the page**: Combine all sections into a single page layout with:
   - Semantic HTML structure (header, main, footer)
   - Proper heading hierarchy (h1, h2, h3)
   - Skip navigation link
   - Consistent spacing using design tokens

4. **Audit the result**: Run audit_component on the final composed page with all categories enabled.

5. **Fix critical issues**: If the audit finds critical or major issues, address them and provide the corrected version.`,
        },
      },
    ],
  };
}

function componentAuditPrompt(args: Record<string, string>) {
  const markup = args.markup || "";
  const componentName = args.component_name || "Component";

  return {
    description: `Comprehensive audit of ${componentName}`,
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Perform a comprehensive audit of the ${componentName} component.

${markup ? `Markup to audit:\n\`\`\`\n${markup}\n\`\`\`\n` : ""}

Follow this workflow:

1. **Run the audit**: Use the audit_component tool with:
   - All three categories: accessibility, performance, responsive
   - wcag_level: "AA"
   ${markup ? `- markup: (the markup provided above)` : "- Ask for the markup if not provided"}
   - component_name: "${componentName}"

2. **Review the checklist**: Read the ui://audit/checklist resource for the full list of checks.

3. **Prioritize fixes**: Group findings by severity (critical first, then major, minor, info).

4. **Provide fix recommendations**: For each critical and major finding:
   - Explain what's wrong
   - Show the exact fix (code snippet)
   - Reference the WCAG criterion if applicable

5. **Generate fixed version**: If there are critical issues, use generate_component to create a corrected version that passes all checks.`,
        },
      },
    ],
  };
}
