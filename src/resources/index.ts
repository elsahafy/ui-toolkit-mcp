import { getTokensAsJSON, getTokenCount } from "../lib/token-store.js";
import { getComponentPatterns } from "../lib/pattern-library.js";

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
    accessibility: [
      { id: "a11y-img-alt", description: "All images have alt text", wcag: "1.1.1", severity: "critical" },
      { id: "a11y-input-label", description: "All form inputs have associated labels", wcag: "1.3.1", severity: "critical" },
      { id: "a11y-heading-hierarchy", description: "Heading levels are sequential", wcag: "2.4.6", severity: "major" },
      { id: "a11y-html-lang", description: "HTML element has lang attribute", wcag: "3.1.1", severity: "major" },
      { id: "a11y-button-text", description: "All buttons have accessible text", wcag: "4.1.2", severity: "critical" },
      { id: "a11y-link-text", description: "Links have descriptive text", wcag: "2.4.4", severity: "major" },
      { id: "a11y-tabindex-positive", description: "No positive tabindex values", wcag: "2.4.3", severity: "major" },
      { id: "a11y-onclick-no-keyboard", description: "Click handlers have keyboard equivalents", wcag: "2.1.1", severity: "critical" },
      { id: "a11y-no-role-on-custom", description: "Custom widgets have ARIA roles", wcag: "4.1.2", severity: "major" },
      { id: "a11y-color-only", description: "Information not conveyed by color alone", wcag: "1.4.1", severity: "major" },
      { id: "a11y-autofocus", description: "Avoid autofocus attribute", wcag: "3.2.1", severity: "minor" },
      { id: "a11y-no-aria-hidden-focusable", description: "No focusable elements with aria-hidden", wcag: "4.1.2", severity: "critical" },
    ],
    performance: [
      { id: "perf-img-no-lazy", description: "Images use loading=\"lazy\"", severity: "major" },
      { id: "perf-img-no-dimensions", description: "Images have width/height attributes", severity: "major" },
      { id: "perf-inline-style-large", description: "No large inline styles", severity: "minor" },
      { id: "perf-deep-nesting", description: "DOM nesting depth under 10 levels", severity: "minor" },
      { id: "perf-inline-script", description: "No inline script blocks", severity: "minor" },
      { id: "perf-large-svg", description: "Inline SVGs under 5KB", severity: "minor" },
      { id: "perf-anonymous-handler", description: "No anonymous arrow functions in JSX props", severity: "info" },
      { id: "perf-no-key-in-list", description: "List items have key props", severity: "major" },
      { id: "perf-unoptimized-font", description: "Font loading uses preconnect", severity: "minor" },
    ],
    responsive: [
      { id: "resp-fixed-width", description: "No fixed pixel widths on containers", severity: "major" },
      { id: "resp-no-viewport", description: "Viewport meta tag present", severity: "critical" },
      { id: "resp-px-font-size", description: "Font sizes use rem/em not px", severity: "major" },
      { id: "resp-table-no-wrapper", description: "Tables have responsive wrappers", severity: "major" },
      { id: "resp-img-no-max-width", description: "Images have max-width: 100%", severity: "major" },
      { id: "resp-small-touch-target", description: "Touch targets are 44x44px minimum", severity: "major" },
      { id: "resp-absolute-position", description: "Limited use of position: absolute", severity: "minor" },
      { id: "resp-no-media-queries", description: "Responsive breakpoints present", severity: "info" },
    ],
  };
}
