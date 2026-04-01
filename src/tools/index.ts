import type { ToolResponse } from "../lib/types.js";
import { handleGenerateComponent } from "./generate-component.js";
import { handleImportDesignTokens } from "./import-design-tokens.js";
import { handleAuditComponent } from "./audit-component.js";
import { handleInspectPage } from "./inspect-page.js";
import { handleVisualDiff } from "./visual-diff.js";
import { handleGenerateStory } from "./generate-story.js";
import { handleExtractFigmaStyles } from "./extract-figma-styles.js";
import { handleClearTokens } from "./clear-tokens.js";

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
    {
      name: "inspect_page",
      description:
        "Inspect a live web page using a headless browser. Extracts accessibility tree, component structure, performance metrics, and an optional screenshot. Requires Playwright (optional dependency).",
      inputSchema: {
        type: "object" as const,
        properties: {
          target_url: {
            type: "string",
            description:
              "The URL to inspect (http:// or https:// only). Private/internal addresses are blocked.",
            maxLength: 2048,
          },
          viewport_width: {
            type: "number",
            description: "Viewport width in pixels (320-3840)",
            default: 1280,
          },
          viewport_height: {
            type: "number",
            description: "Viewport height in pixels (240-2160)",
            default: 720,
          },
          wait_for: {
            type: "string",
            enum: ["load", "domcontentloaded", "networkidle"],
            description: "When to consider the page loaded",
            default: "load",
          },
          timeout_ms: {
            type: "number",
            description: "Navigation timeout in milliseconds (5000-60000)",
            default: 30000,
          },
          include_screenshot: {
            type: "boolean",
            description: "Include a base64 PNG screenshot in the response",
            default: true,
          },
        },
        required: ["target_url"],
      },
    },
    {
      name: "visual_diff",
      description:
        "Compare two PNG screenshots pixel-by-pixel for visual regression testing. Returns diff statistics including changed pixel count and percentage. Does not require Playwright.",
      inputSchema: {
        type: "object" as const,
        properties: {
          before_image: {
            type: "string",
            description: "Base64-encoded PNG of the 'before' snapshot (no data URI prefix)",
          },
          after_image: {
            type: "string",
            description: "Base64-encoded PNG of the 'after' snapshot (no data URI prefix)",
          },
          threshold: {
            type: "number",
            description:
              "Per-channel difference threshold (0-255) below which pixels are considered identical",
            default: 10,
          },
        },
        required: ["before_image", "after_image"],
      },
    },
    {
      name: "generate_story",
      description:
        "Auto-generate a Storybook story file (CSF3 format) for a UI component. Detects props from code, includes default story, variant stories, play functions, and accessibility addon config.",
      inputSchema: {
        type: "object" as const,
        properties: {
          component_code: {
            type: "string",
            description: "Full source code of the component to generate stories for",
            maxLength: 200000,
          },
          framework: {
            type: "string",
            enum: ["react", "vue", "svelte", "angular"],
            description: "Framework the component is written in",
          },
          component_name: {
            type: "string",
            description: "PascalCase name of the component (e.g., 'ProductCard')",
            maxLength: 100,
          },
          story_title: {
            type: "string",
            description:
              "Storybook story title/path (e.g., 'Components/ProductCard'). Defaults to 'Components/{component_name}'",
            maxLength: 200,
          },
        },
        required: ["component_code", "framework", "component_name"],
      },
    },
    {
      name: "extract_figma_styles",
      description:
        "Extract design tokens (colors, typography, effects) from a Figma file via the Figma REST API. Normalizes tokens and loads them into the active token store. Requires a Figma Personal Access Token.",
      inputSchema: {
        type: "object" as const,
        properties: {
          figma_file_key: {
            type: "string",
            description:
              "The Figma file key (alphanumeric ID from the file URL, e.g., 'abc123XYZ')",
            maxLength: 100,
          },
          figma_pat: {
            type: "string",
            description:
              "Figma Personal Access Token for API access. Not stored or logged. Generate at figma.com/developers/api#access-tokens",
            maxLength: 500,
          },
          node_ids: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional specific node IDs to extract. If omitted, extracts all published styles.",
          },
          namespace: {
            type: "string",
            description:
              "Optional prefix for extracted token CSS variables (e.g., 'figma' produces --figma-color-primary)",
            maxLength: 50,
          },
          merge_strategy: {
            type: "string",
            enum: ["replace", "merge-overwrite", "merge-keep"],
            description: "How to handle conflicts with existing tokens",
            default: "replace",
          },
        },
        required: ["figma_file_key", "figma_pat"],
      },
    },
    {
      name: "clear_tokens",
      description:
        "Clear all design tokens from the active token store. Use this to reset before importing a new set of tokens.",
      inputSchema: {
        type: "object" as const,
        properties: {},
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
    case "inspect_page":
      return handleInspectPage(args);
    case "visual_diff":
      return handleVisualDiff(args);
    case "generate_story":
      return handleGenerateStory(args);
    case "extract_figma_styles":
      return handleExtractFigmaStyles(args);
    case "clear_tokens":
      return handleClearTokens(args);
    default:
      return {
        content: [{ type: "text", text: `Error: Unknown tool: ${name}` }],
        isError: true,
      };
  }
}
