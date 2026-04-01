import type { AuditFinding, WcagLevel } from "./types.js";

// ========================================
// WCAG ACCESSIBILITY AUDIT RULES
// ========================================

interface Rule {
  id: string;
  level: WcagLevel;
  test: (markup: string) => boolean;
  message: string;
  suggestion: string;
  wcag: string;
  severity: "critical" | "major" | "minor" | "info";
}

const rules: readonly Rule[] = [
  {
    id: "a11y-img-alt",
    level: "A",
    test: (m) => /<img(?![^>]*alt[\s=])/i.test(m) && /<img/i.test(m),
    message: "Images found without alt attribute",
    suggestion: "Add descriptive alt text to all <img> elements. Use alt=\"\" for decorative images.",
    wcag: "1.1.1",
    severity: "critical",
  },
  {
    id: "a11y-input-label",
    level: "A",
    test: (m) => {
      const inputs = m.match(/<(?:input|select|textarea)(?![^>]*aria-label)/gi) || [];
      const labels = m.match(/<label[^>]*for=/gi) || [];
      return inputs.length > labels.length;
    },
    message: "Form inputs found without associated labels",
    suggestion: "Associate every <input>, <select>, and <textarea> with a <label> using for/id, or use aria-label.",
    wcag: "1.3.1",
    severity: "critical",
  },
  {
    id: "a11y-heading-hierarchy",
    level: "AA",
    test: (m) => {
      const headings = [...m.matchAll(/<h([1-6])/gi)].map((h) => parseInt(h[1], 10));
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] - headings[i - 1] > 1) return true;
      }
      return false;
    },
    message: "Heading levels are skipped (e.g., h1 to h3 without h2)",
    suggestion: "Use sequential heading levels without skipping. Each heading should be at most one level deeper than its predecessor.",
    wcag: "2.4.6",
    severity: "major",
  },
  {
    id: "a11y-html-lang",
    level: "A",
    test: (m) => /<html/i.test(m) && !/<html[^>]*lang=/i.test(m),
    message: "Missing lang attribute on <html> element",
    suggestion: 'Add lang attribute to <html> (e.g., <html lang="en">).',
    wcag: "3.1.1",
    severity: "major",
  },
  {
    id: "a11y-button-text",
    level: "A",
    test: (m) => /<button[^>]*>[\s]*<\/button>/i.test(m) || /<button[^>]*>\s*<(?:img|svg|i|span)\s/i.test(m) && !/<button[^>]*aria-label/i.test(m),
    message: "Buttons found without accessible text content",
    suggestion: "Ensure all buttons have visible text or aria-label. Icon-only buttons need aria-label.",
    wcag: "4.1.2",
    severity: "critical",
  },
  {
    id: "a11y-link-text",
    level: "A",
    test: (m) => /<a[^>]*>[\s]*(click here|here|read more|more|link)[\s]*<\/a>/i.test(m),
    message: "Links with non-descriptive text (e.g., 'click here', 'read more')",
    suggestion: "Use descriptive link text that makes sense out of context. Describe where the link goes.",
    wcag: "2.4.4",
    severity: "major",
  },
  {
    id: "a11y-tabindex-positive",
    level: "AA",
    test: (m) => /tabindex=["'][1-9]/i.test(m),
    message: "Positive tabindex values found (disrupts natural tab order)",
    suggestion: "Use tabindex=\"0\" to make elements focusable in natural order. Avoid positive tabindex values.",
    wcag: "2.4.3",
    severity: "major",
  },
  {
    id: "a11y-onclick-no-keyboard",
    level: "A",
    test: (m) => {
      const hasOnClick = /onClick|on:click|@click|\(click\)/i.test(m);
      const hasKeyHandler = /onKeyDown|onKeyUp|onKeyPress|on:keydown|@keydown/i.test(m);
      const isOnNonInteractive = /<(?:div|span|li|td|tr)[^>]*(?:onClick|on:click|@click)/i.test(m);
      return hasOnClick && !hasKeyHandler && isOnNonInteractive;
    },
    message: "Click handlers on non-interactive elements without keyboard equivalents",
    suggestion: "Add onKeyDown/onKeyUp handlers alongside onClick on non-interactive elements, or use <button> instead.",
    wcag: "2.1.1",
    severity: "critical",
  },
  {
    id: "a11y-no-role-on-custom",
    level: "AA",
    test: (m) => {
      const customDivs = m.match(/<div[^>]*class=["'][^"']*(?:modal|dialog|tab|menu|alert|tooltip|dropdown)[^"']*["'][^>]*>/gi) || [];
      return customDivs.some((el) => !/role=/i.test(el));
    },
    message: "Custom interactive widgets missing ARIA role attribute",
    suggestion: "Add appropriate role attribute (e.g., role=\"dialog\", role=\"tablist\", role=\"alert\").",
    wcag: "4.1.2",
    severity: "major",
  },
  {
    id: "a11y-color-only",
    level: "A",
    test: (m) => /class=["'][^"']*(?:text-red|text-green|error-red|success-green)[^"']*["']/i.test(m) && !/aria-|role=/i.test(m),
    message: "Information may be conveyed by color alone",
    suggestion: "Don't rely solely on color to convey meaning. Add icons, text, or ARIA attributes alongside color indicators.",
    wcag: "1.4.1",
    severity: "major",
  },
  {
    id: "a11y-autofocus",
    level: "AAA",
    test: (m) => /autofocus/i.test(m),
    message: "autofocus attribute found (can disorient screen reader users)",
    suggestion: "Avoid autofocus. Manage focus programmatically when needed, especially in modals or dialogs.",
    wcag: "3.2.1",
    severity: "minor",
  },
  {
    id: "a11y-no-aria-hidden-focusable",
    level: "A",
    test: (m) => /aria-hidden=["']true["'][^>]*(?:tabindex|href|button|input|select|textarea)/i.test(m),
    message: "Focusable elements hidden with aria-hidden=\"true\"",
    suggestion: "Don't use aria-hidden on focusable elements. Either remove aria-hidden or add tabindex=\"-1\".",
    wcag: "4.1.2",
    severity: "critical",
  },
];

const levelOrder: Record<WcagLevel, number> = { A: 1, AA: 2, AAA: 3 };

export function runAccessibilityAudit(
  markup: string,
  level: WcagLevel = "AA",
  _framework: string = "html"
): AuditFinding[] {
  const maxLevel = levelOrder[level];
  const findings: AuditFinding[] = [];

  for (const rule of rules) {
    if (levelOrder[rule.level] > maxLevel) continue;

    if (rule.test(markup)) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        category: "accessibility",
        message: rule.message,
        suggestion: rule.suggestion,
        wcagCriterion: rule.wcag,
        confidence: 0.85,
      });
    }
  }

  return findings;
}
