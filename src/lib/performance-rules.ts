import type { AuditFinding } from "./types.js";

// ========================================
// PERFORMANCE AUDIT RULES
// ========================================

interface PerfRule {
  id: string;
  test: (markup: string) => boolean;
  message: string;
  suggestion: string;
  severity: "critical" | "major" | "minor" | "info";
}

const rules: readonly PerfRule[] = [
  {
    id: "perf-img-no-lazy",
    test: (m) => /<img(?![^>]*loading=)/i.test(m) && /<img/i.test(m),
    message: "Images without loading=\"lazy\" attribute",
    suggestion: "Add loading=\"lazy\" to off-screen images to defer loading until they're near the viewport.",
    severity: "major",
  },
  {
    id: "perf-img-no-dimensions",
    test: (m) => {
      const imgs = m.match(/<img[^>]*>/gi) || [];
      return imgs.some((img) => !/width=/i.test(img) || !/height=/i.test(img));
    },
    message: "Images without explicit width/height (causes layout shift)",
    suggestion: "Add width and height attributes to all images to prevent CLS (Cumulative Layout Shift).",
    severity: "major",
  },
  {
    id: "perf-inline-style-large",
    test: (m) => {
      const inlineStyles = m.match(/style=["'][^"']{500,}["']/gi);
      return inlineStyles !== null;
    },
    message: "Large inline styles detected (>500 chars)",
    suggestion: "Move large inline styles to CSS classes or CSS modules for better cacheability and maintainability.",
    severity: "minor",
  },
  {
    id: "perf-deep-nesting",
    test: (m) => {
      let maxDepth = 0;
      let depth = 0;
      const tags = m.match(/<\/?div[^>]*>/gi) || [];
      for (const tag of tags) {
        if (tag.startsWith("</")) {
          depth--;
        } else {
          depth++;
          maxDepth = Math.max(maxDepth, depth);
        }
      }
      return maxDepth > 10;
    },
    message: "Excessive DOM nesting depth (>10 levels of div nesting)",
    suggestion: "Flatten DOM structure. Deep nesting increases rendering time and paint complexity.",
    severity: "minor",
  },
  {
    id: "perf-inline-script",
    test: (m) => /<script(?![^>]*src=)[^>]*>/i.test(m),
    message: "Inline <script> blocks detected",
    suggestion: "Move scripts to external files for better caching. Use defer or async attributes for loading.",
    severity: "minor",
  },
  {
    id: "perf-large-svg",
    test: (m) => {
      const svgs = m.match(/<svg[\s\S]*?<\/svg>/gi) || [];
      return svgs.some((svg) => svg.length > 5000);
    },
    message: "Large inline SVG (>5KB) detected",
    suggestion: "Optimize SVGs with SVGO or move to external files. Consider using <img> with SVG src for large graphics.",
    severity: "minor",
  },
  {
    id: "perf-anonymous-handler",
    test: (m) => /(?:onClick|onChange|onSubmit)=\{[\s]*\([^)]*\)[\s]*=>/i.test(m),
    message: "Anonymous arrow functions in JSX event props (React re-render risk)",
    suggestion: "Extract inline handlers to named functions or useCallback to prevent unnecessary re-renders.",
    severity: "info",
  },
  {
    id: "perf-no-key-in-list",
    test: (m) => /\.map\s*\([^)]*\)\s*=>\s*[^}]*<(?!.*\bkey=)/i.test(m),
    message: "List rendering without key prop (React/Vue)",
    suggestion: "Add a unique key prop to every element in a list rendering (.map) for efficient reconciliation.",
    severity: "major",
  },
  {
    id: "perf-unoptimized-font",
    test: (m) => /<link[^>]*fonts\.googleapis\.com[^>]*>/i.test(m) && !/<link[^>]*rel=["']preconnect["']/i.test(m),
    message: "Google Fonts loaded without preconnect hint",
    suggestion: "Add <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"> before font stylesheets.",
    severity: "minor",
  },
];

export function runPerformanceAudit(markup: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const rule of rules) {
    if (rule.test(markup)) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: "performance",
        message: rule.message,
        suggestion: rule.suggestion,
        confidence: 0.8,
      });
    }
  }

  return findings;
}
