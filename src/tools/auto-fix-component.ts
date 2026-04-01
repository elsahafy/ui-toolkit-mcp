import type { ToolResponse, AuditFinding } from "../lib/types.js";
import { validateMaxLength } from "../lib/validation.js";

interface Fix {
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
}

const fixMap: Record<string, Fix> = {
  "a11y-img-alt": {
    pattern: /<img(?![^>]*alt[\s=])([^>]*)>/gi,
    replacement: '<img alt=""$1>',
    description: "Added empty alt attribute to images",
  },
  "a11y-html-lang": {
    pattern: /<html(?![^>]*lang=)([^>]*)>/gi,
    replacement: '<html lang="en"$1>',
    description: 'Added lang="en" to <html>',
  },
  "perf-img-no-lazy": {
    pattern: /<img(?![^>]*loading=)([^>]*)>/gi,
    replacement: '<img loading="lazy"$1>',
    description: 'Added loading="lazy" to images',
  },
  "a11y-tabindex-positive": {
    pattern: /tabindex=["'][1-9]\d*["']/gi,
    replacement: 'tabindex="0"',
    description: "Changed positive tabindex to 0",
  },
  "resp-px-font-size": {
    pattern: /font-size:\s*(\d+)px/gi,
    replacement: (_match: string) => {
      const px = parseInt(_match.match(/(\d+)px/i)![1], 10);
      return `font-size: ${(px / 16).toFixed(3).replace(/\.?0+$/, "")}rem`;
    },
    description: "Converted px font-size to rem",
  },
};

export async function handleAutoFixComponent(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const markup = args.markup as string | undefined;
  if (!markup) return error("Missing required parameter: markup");

  const lenErr = validateMaxLength(markup, 200000, "markup");
  if (lenErr) return error(lenErr);

  const findings = args.findings as AuditFinding[] | undefined;
  if (!findings || !Array.isArray(findings) || findings.length === 0) {
    return error("Missing or empty findings array. Run audit_component first.");
  }

  let fixed = markup;
  const applied: string[] = [];

  for (const finding of findings) {
    const fix = fixMap[finding.id];
    if (!fix) continue;

    const before = fixed;
    if (typeof fix.replacement === "function") {
      fixed = fixed.replace(fix.pattern, fix.replacement);
    } else {
      fixed = fixed.replace(fix.pattern, fix.replacement);
    }
    if (fixed !== before) {
      applied.push(`- ${fix.description} (${finding.id})`);
    }
  }

  const parts: string[] = [];
  parts.push(`## Auto-Fix Results\n`);
  parts.push(`**${applied.length} fixes applied** out of ${findings.length} findings\n`);

  if (applied.length > 0) {
    parts.push("### Applied Fixes");
    parts.push(applied.join("\n"));
    parts.push("");
  }

  const unfixed = findings.filter((f) => !fixMap[f.id]).map((f) => `- ${f.id}: ${f.message} (manual fix required)`);
  if (unfixed.length > 0) {
    parts.push("### Manual Fixes Needed");
    parts.push(unfixed.join("\n"));
    parts.push("");
  }

  parts.push("### Fixed Markup");
  parts.push("```html\n" + fixed + "\n```");

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
