import type { ToolResponse, AuditCategory, WcagLevel } from "../lib/types.js";
import { validateUrl, getPlaywright, getBrowser, getInstallMessage } from "../lib/browser.js";
import { validateMaxLength } from "../lib/validation.js";
import { handleAuditComponent } from "./audit-component.js";

const CATEGORIES = new Set(["accessibility", "performance", "responsive"]);
const WCAG_LEVELS = new Set(["A", "AA", "AAA"]);

export async function handleLiveAudit(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const url = args.target_url as string | undefined;
  if (!url) return error("Missing required parameter: target_url");

  const lenErr = validateMaxLength(url, 2048, "target_url");
  if (lenErr) return error(lenErr);

  const urlError = validateUrl(url);
  if (urlError) return error(urlError);

  const pw = await getPlaywright();
  if (!pw) return error(getInstallMessage());

  const wcagLevel = ((args.wcag_level as string) || "AA") as WcagLevel;
  if (!WCAG_LEVELS.has(wcagLevel)) return error("Invalid wcag_level");

  let categories: AuditCategory[];
  if (Array.isArray(args.categories)) {
    categories = args.categories.filter((c): c is AuditCategory =>
      typeof c === "string" && CATEGORIES.has(c)
    );
    if (categories.length === 0) categories = ["accessibility", "performance", "responsive"];
  } else {
    categories = ["accessibility", "performance", "responsive"];
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });

    const title = await page.title().catch(() => "");
    const html = await page.content();

    // Run audit on the extracted HTML
    const auditResult = await handleAuditComponent({
      markup: html,
      component_name: title || url,
      categories,
      wcag_level: wcagLevel,
      framework: "html",
    });

    const parts: string[] = [];
    parts.push(`## Live Audit: ${url}\n`);
    parts.push(`**Page**: ${title || "(untitled)"}`);
    parts.push(`**HTML size**: ${html.length.toLocaleString()} chars\n`);

    // Parse and re-format the audit result
    const auditText = auditResult.content[0].text;
    if (!auditResult.isError) {
      const report = JSON.parse(auditText);
      parts.push(`### Score: ${report.score}/100\n`);
      parts.push(`| Severity | Count |`);
      parts.push(`|----------|-------|`);
      parts.push(`| Critical | ${report.summary.critical} |`);
      parts.push(`| Major | ${report.summary.major} |`);
      parts.push(`| Minor | ${report.summary.minor} |`);
      parts.push(`| Info | ${report.summary.info} |`);
      parts.push(`| **Total** | **${report.summary.total}** |\n`);

      if (report.findings.length > 0) {
        parts.push("### Findings\n");
        for (const f of report.findings) {
          const wcag = f.wcagCriterion ? ` (WCAG ${f.wcagCriterion})` : "";
          parts.push(`- **${f.severity}**${wcag}: ${f.message}`);
          parts.push(`  - Fix: ${f.suggestion}`);
        }
      }
    } else {
      parts.push(`### Audit Error\n${auditText}`);
    }

    return { content: [{ type: "text", text: parts.join("\n") }] };
  } catch (err) {
    return error(`Live audit failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await page.close().catch(() => {});
  }
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
