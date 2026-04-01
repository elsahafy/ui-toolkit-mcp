import { getTokensAsJSON, getTokenCount } from "../lib/token-store.js";
import { getComponentPatterns } from "../lib/pattern-library.js";
import { getAccessibilityRuleMetadata } from "../lib/accessibility-rules.js";
import { getPerformanceRuleMetadata } from "../lib/performance-rules.js";
import { getResponsiveRuleMetadata } from "../lib/responsive-rules.js";

// ========================================
// RESOURCE DEFINITIONS
// ========================================

export function getResourceDefinitions() {
  return [
    {
      uri: "ui://tokens/active",
      name: "Active Design Tokens",
      description:
        "Currently loaded design tokens. Import tokens with the import_design_tokens tool to populate this resource.",
      mimeType: "application/json",
    },
    {
      uri: "ui://patterns/components",
      name: "Component Pattern Library",
      description:
        "Reference library of common UI component patterns with accessibility requirements, variants, and structure.",
      mimeType: "application/json",
    },
    {
      uri: "ui://audit/checklist",
      name: "Audit Checklist",
      description:
        "Comprehensive checklist of accessibility, performance, and responsive design checks used by audit_component.",
      mimeType: "application/json",
    },
  ];
}

// ========================================
// RESOURCE READ
// ========================================

export function readResource(uri: string): { uri: string; mimeType: string; text: string } {
  switch (uri) {
    case "ui://tokens/active":
      return {
        uri,
        mimeType: "application/json",
        text: getTokenCount() > 0
          ? getTokensAsJSON()
          : JSON.stringify({ message: "No design tokens loaded. Use the import_design_tokens tool to import tokens.", count: 0 }, null, 2),
      };

    case "ui://patterns/components":
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(getComponentPatterns(), null, 2),
      };

    case "ui://audit/checklist":
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(getAuditChecklist(), null, 2),
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

function getAuditChecklist(): object {
  return {
    accessibility: getAccessibilityRuleMetadata(),
    performance: getPerformanceRuleMetadata(),
    responsive: getResponsiveRuleMetadata(),
  };
}
