// ========================================
// SHARED TYPES
// ========================================

export type Framework = "react" | "vue" | "svelte" | "angular" | "web-components";
export type TokenFormat = "figma-tokens" | "style-dictionary" | "css-custom-properties";
export type MergeStrategy = "replace" | "merge-overwrite" | "merge-keep";
export type AuditCategory = "accessibility" | "performance" | "responsive";
export type Severity = "critical" | "major" | "minor" | "info";
export type WcagLevel = "A" | "AA" | "AAA";
export type Variant = "default" | "outlined" | "filled" | "ghost" | "elevated";
export type Size = "sm" | "md" | "lg" | "xl";

export interface NormalizedToken {
  readonly name: string;
  readonly cssVariable: string;
  readonly value: string;
  readonly type: string;
  readonly category: string;
  readonly description: string;
}

export interface AuditFinding {
  readonly id: string;
  readonly severity: Severity;
  readonly category: AuditCategory;
  readonly message: string;
  readonly suggestion: string;
  readonly wcagCriterion?: string;
  readonly confidence: number;
}

export interface AuditReport {
  readonly componentName: string;
  readonly framework: string;
  readonly score: number;
  readonly findings: readonly AuditFinding[];
  readonly summary: {
    readonly critical: number;
    readonly major: number;
    readonly minor: number;
    readonly info: number;
    readonly total: number;
  };
  readonly categories: readonly AuditCategory[];
}

export interface ComponentOutput {
  readonly componentName: string;
  readonly framework: Framework;
  readonly markup: string;
  readonly styles: string;
  readonly test: string;
  readonly tokensUsed: readonly string[];
}

export interface ToolResponse {
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
  readonly isError?: boolean;
}
