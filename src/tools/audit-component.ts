import type { ToolResponse, AuditCategory, AuditFinding, AuditReport, WcagLevel } from "../lib/types.js";
import { runAccessibilityAudit } from "../lib/accessibility-rules.js";
import { runPerformanceAudit } from "../lib/performance-rules.js";
import { runResponsiveAudit } from "../lib/responsive-rules.js";
import { validateMaxLength } from "../lib/validation.js";

const CATEGORIES = new Set(["accessibility", "performance", "responsive"]);
const WCAG_LEVELS = new Set(["A", "AA", "AAA"]);
const FRAMEWORKS = new Set(["react", "vue", "svelte", "angular", "web-components", "html"]);

export async function handleAuditComponent(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const markup = args.markup as string | undefined;

  if (!markup) {
    return error("Missing required parameter: markup");
  }

  const lenErr = validateMaxLength(markup, 200000, "markup");
  if (lenErr) return error(lenErr);

  const componentName = (args.component_name as string) || "Unnamed Component";
  if (args.component_name) {
    const nameErr = validateMaxLength(componentName, 100, "component_name");
    if (nameErr) return error(nameErr);
  }
  const framework = (args.framework as string) || "html";

  if (!FRAMEWORKS.has(framework)) {
    return error(`Invalid framework: ${framework}. Must be one of: ${[...FRAMEWORKS].join(", ")}`);
  }

  const wcagLevel = ((args.wcag_level as string) || "AA") as WcagLevel;
  if (!WCAG_LEVELS.has(wcagLevel)) {
    return error(`Invalid wcag_level: ${wcagLevel}. Must be one of: A, AA, AAA`);
  }

  let categories: AuditCategory[];
  if (Array.isArray(args.categories)) {
    categories = args.categories.filter((c): c is AuditCategory =>
      typeof c === "string" && CATEGORIES.has(c)
    );
    if (categories.length === 0) categories = ["accessibility", "performance", "responsive"];
  } else {
    categories = ["accessibility", "performance", "responsive"];
  }

  const findings: AuditFinding[] = [];

  if (categories.includes("accessibility")) {
    findings.push(...runAccessibilityAudit(markup, wcagLevel, framework));
  }

  if (categories.includes("performance")) {
    findings.push(...runPerformanceAudit(markup));
  }

  if (categories.includes("responsive")) {
    findings.push(...runResponsiveAudit(markup));
  }

  const summary = {
    critical: findings.filter((f) => f.severity === "critical").length,
    major: findings.filter((f) => f.severity === "major").length,
    minor: findings.filter((f) => f.severity === "minor").length,
    info: findings.filter((f) => f.severity === "info").length,
    total: findings.length,
  };

  const score = Math.max(
    0,
    100 - summary.critical * 10 - summary.major * 5 - summary.minor * 2
  );

  const report: AuditReport = {
    componentName,
    framework,
    score,
    findings,
    summary,
    categories,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
  };
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
