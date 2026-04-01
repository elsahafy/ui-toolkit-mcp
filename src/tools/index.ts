import type { ToolResponse } from "../lib/types.js";
import { handleGenerateComponent } from "./generate-component.js";
import { handleImportDesignTokens } from "./import-design-tokens.js";
import { handleAuditComponent } from "./audit-component.js";

// ========================================
// TOOL DEFINITIONS
// ========================================

export function getToolDefinitions() {
  return [
    {
      name: "generate_component",
      description:
        "Generate a production-ready UI component in any framework (React, Vue, Svelte, Angular, Web Components) from a natural language description. Uses active design tokens if loaded.",
      inputSchema: {
        type: "object" as const,
        properties: {
          description: {
            type: "string",
            description:
              "Natural language description of the component (e.g., 'a card with image, title, description, and action buttons')",
            maxLength: 2000,
          },
          framework: {
            type: "string",
            enum: ["react", "vue", "svelte", "angular", "web-components"],
            description: "Target UI framework for the generated component",
          },
          component_name: {
            type: "string",
            description: "PascalCase name for the component (e.g., 'ProductCard')",
            maxLength: 100,
          },
          variant: {
            type: "string",
            enum: ["default", "outlined", "filled", "ghost", "elevated"],
            description: "Visual variant style",
            default: "default",
          },
          size: {
            type: "string",
            enum: ["sm", "md", "lg", "xl"],
            description: "Size preset",
            default: "md",
          },
          include_styles: {
            type: "boolean",
            description: "Include CSS styles using active design tokens",
            default: true,
          },
          include_tests: {
            type: "boolean",
            description: "Generate a companion test file",
            default: false,
          },
          responsive: {
            type: "boolean",
            description: "Include responsive breakpoint styles",
            default: true,
          },
        },
        required: ["description", "framework", "component_name"],
      },
    },
    {
      name: "import_design_tokens",
      description:
        "Import design tokens from Figma Tokens JSON, Style Dictionary, or CSS custom properties into the active token store. Imported tokens are used by generate_component for styling.",
      inputSchema: {
        type: "object" as const,
        properties: {
          tokens_json: {
            type: "string",
            description:
              "Raw JSON string of design tokens. Supports Figma Tokens, Style Dictionary, or flat CSS custom properties format.",
            maxLength: 500000,
          },
          format: {
            type: "string",
            enum: ["figma-tokens", "style-dictionary", "css-custom-properties"],
            description: "Format of the provided token data",
          },
          namespace: {
            type: "string",
            description:
              "Optional prefix for all imported tokens (e.g., 'brand' produces --brand-color-primary)",
            maxLength: 50,
          },
          merge_strategy: {
            type: "string",
            enum: ["replace", "merge-overwrite", "merge-keep"],
            description:
              "How to handle conflicts with existing tokens. 'replace' clears all. 'merge-overwrite' overwrites conflicts. 'merge-keep' keeps existing.",
            default: "replace",
          },
        },
        required: ["tokens_json", "format"],
      },
    },
    {
      name: "audit_component",
      description:
        "Audit HTML/JSX/Vue/Svelte markup for accessibility (WCAG), performance, and responsive design issues. Returns scored findings with fix suggestions.",
      inputSchema: {
        type: "object" as const,
        properties: {
          markup: {
            type: "string",
            description: "HTML, JSX, Vue SFC, or Svelte markup to audit",
            maxLength: 200000,
          },
          component_name: {
            type: "string",
            description: "Name of the component (for report labeling)",
            maxLength: 100,
          },
          categories: {
            type: "array",
            items: {
              type: "string",
              enum: ["accessibility", "performance", "responsive"],
            },
            description: "Audit categories to run. Defaults to all three.",
          },
          wcag_level: {
            type: "string",
            enum: ["A", "AA", "AAA"],
            description: "WCAG conformance level",
            default: "AA",
          },
          framework: {
            type: "string",
            enum: ["react", "vue", "svelte", "angular", "web-components", "html"],
            description: "Framework of the markup (affects parsing)",
            default: "html",
          },
        },
        required: ["markup"],
      },
    },
  ];
}

// ========================================
// TOOL DISPATCH
// ========================================

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  switch (name) {
    case "generate_component":
      return handleGenerateComponent(args);
    case "import_design_tokens":
      return handleImportDesignTokens(args);
    case "audit_component":
      return handleAuditComponent(args);
    default:
      return {
        content: [{ type: "text", text: `Error: Unknown tool: ${name}` }],
        isError: true,
      };
  }
}
