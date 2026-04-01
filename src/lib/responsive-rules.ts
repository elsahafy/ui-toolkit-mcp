import type { AuditFinding } from "./types.js";

// ========================================
// RESPONSIVE DESIGN AUDIT RULES
// ========================================

interface ResponsiveRule {
  id: string;
  test: (markup: string) => boolean;
  message: string;
  suggestion: string;
  severity: "critical" | "major" | "minor" | "info";
}

const rules: readonly ResponsiveRule[] = [
  {
    id: "resp-fixed-width",
    test: (m) => /width:\s*\d{3,}px/i.test(m) && !/max-width/i.test(m),
    message: "Fixed pixel widths on containers without max-width",
    suggestion: "Use relative units (%, vw, rem) or add max-width with width: 100% for responsive containers.",
    severity: "major",
  },
  {
    id: "resp-no-viewport",
    test: (m) => /<html/i.test(m) && /<head/i.test(m) && !/<meta[^>]*viewport/i.test(m),
    message: "Missing viewport meta tag",
    suggestion: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> in <head>.",
    severity: "critical",
  },
  {
    id: "resp-px-font-size",
    test: (m) => /font-size:\s*\d+px/i.test(m),
    message: "Font sizes in px (not accessible for user zoom preferences)",
    suggestion: "Use rem or em for font sizes instead of px. This respects user browser zoom settings.",
    severity: "major",
  },
  {
    id: "resp-table-no-wrapper",
    test: (m) => /<table/i.test(m) && !/<div[^>]*(?:overflow|scroll|responsive|table-wrapper)[^>]*>[\s]*<table/i.test(m),
    message: "Table without responsive wrapper (horizontal scroll on mobile)",
    suggestion: "Wrap tables in a container with overflow-x: auto for horizontal scrolling on small screens.",
    severity: "major",
  },
  {
    id: "resp-img-no-max-width",
    test: (m) => /<img/i.test(m) && !/max-width:\s*100%/i.test(m) && !/img[^{]*\{[^}]*max-width/i.test(m),
    message: "Images without max-width: 100% (may overflow on mobile)",
    suggestion: "Add max-width: 100% and height: auto to images to prevent overflow.",
    severity: "major",
  },
  {
    id: "resp-small-touch-target",
    test: (m) => {
      // Match widths/heights from 1-43px on interactive elements
      const smallTargets = m.match(/(?:width|height):\s*(?:[1-3]?\d|4[0-3])px/gi) || [];
      const hasInteractive = /<(?:button|a|input|select)[^>]*style=/i.test(m);
      return smallTargets.length > 0 && hasInteractive;
    },
    message: "Interactive elements may have touch targets smaller than 44x44px",
    suggestion: "Ensure all interactive elements (buttons, links, inputs) have a minimum touch target of 44x44px.",
    severity: "major",
  },
  {
    id: "resp-absolute-position",
    test: (m) => /position:\s*absolute/gi.test(m) && (m.match(/position:\s*absolute/gi) || []).length > 3,
    message: "Excessive use of position: absolute (breaks responsive flow)",
    suggestion: "Prefer flexbox or grid layout over absolute positioning. Absolute elements don't participate in responsive flow.",
    severity: "minor",
  },
  {
    id: "resp-no-media-queries",
    test: (m) => {
      const hasMultipleStyles = (m.match(/style=|<style/gi) || []).length > 3;
      const hasMediaQuery = /@media/i.test(m);
      return hasMultipleStyles && !hasMediaQuery;
    },
    message: "Styled component with no media queries or responsive breakpoints",
    suggestion: "Add media queries or use CSS container queries for responsive behavior at different viewport sizes.",
    severity: "info",
  },
];

export function runResponsiveAudit(markup: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const rule of rules) {
    if (rule.test(markup)) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: "responsive",
        message: rule.message,
        suggestion: rule.suggestion,
        confidence: 0.75,
      });
    }
  }

  return findings;
}

export function getResponsiveRuleMetadata() {
  return rules.map((r) => ({ id: r.id, description: r.message, severity: r.severity }));
}
