import type { ToolResponse, WaitForEvent } from "../lib/types.js";
import { validateUrl, getPlaywright, getBrowser, getInstallMessage } from "../lib/browser.js";
import { validateMaxLength } from "../lib/validation.js";

const WAIT_EVENTS = new Set(["load", "domcontentloaded", "networkidle"]);

export async function handleInspectPage(
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

  const viewportWidth = clamp(args.viewport_width as number | undefined, 320, 3840, 1280);
  const viewportHeight = clamp(args.viewport_height as number | undefined, 240, 2160, 720);
  const waitFor = WAIT_EVENTS.has(args.wait_for as string) ? (args.wait_for as WaitForEvent) : "load";
  const timeoutMs = clamp(args.timeout_ms as number | undefined, 5000, 60000, 30000);
  const includeScreenshot = args.include_screenshot !== false;

  let browser;
  try {
    browser = await getBrowser();
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }

  const page = await browser.newPage({
    viewport: { width: viewportWidth, height: viewportHeight },
  });

  try {
    await page.goto(url, { waitUntil: waitFor, timeout: timeoutMs });

    // Extract metadata
    const title = await page.title().catch(() => "");
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => "") ?? "";

    // Accessibility tree — use ariaSnapshot (Playwright 1.49+) with fallback
    let a11yTree = "";
    try {
      // Try modern API first
      a11yTree = await page.locator("body").ariaSnapshot();
    } catch {
      try {
        // Fallback for older Playwright
        const snapshot = await page.accessibility.snapshot();
        a11yTree = snapshot ? JSON.stringify(snapshot, null, 2) : "No accessibility tree available";
      } catch {
        a11yTree = "Could not capture accessibility tree";
      }
    }
    if (a11yTree.length > 5000) {
      a11yTree = a11yTree.slice(0, 5000) + "\n... (truncated)";
    }

    // Component structure + performance via page.evaluate
    const pageData = await page.evaluate(`(() => {
      const semanticTags = ["main", "nav", "header", "footer", "section", "article", "aside", "form"];

      function walkNode(el, depth) {
        if (depth > 5) return null;
        const tag = el.tagName.toLowerCase();
        if (!semanticTags.includes(tag) && depth > 0) return null;
        const role = el.getAttribute("role");
        const children = [];
        for (const child of el.children) {
          const node = walkNode(child, depth + 1);
          if (node) children.push(node);
        }
        if (!semanticTags.includes(tag) && children.length === 0) return null;
        return { tag, role, children };
      }

      const structure = [];
      for (const child of document.body.children) {
        const node = walkNode(child, 0);
        if (node) structure.push(node);
      }

      const navEntry = performance.getEntriesByType("navigation")[0];
      const loadTime = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 0;
      const resourceCount = performance.getEntriesByType("resource").length;
      const domNodes = document.querySelectorAll("*").length;

      return { structure, loadTime, resourceCount, domNodes };
    })()`) as { structure: unknown[]; loadTime: number; resourceCount: number; domNodes: number };

    // Screenshot
    let screenshotBase64: string | null = null;
    if (includeScreenshot) {
      const buffer = await page.screenshot({ type: "png" });
      screenshotBase64 = buffer.toString("base64");
    }

    // Format output
    const parts: string[] = [];
    parts.push(`## Page Inspection: ${url}\n`);
    parts.push(`### Metadata`);
    parts.push(`- **Title**: ${title || "(none)"}`);
    parts.push(`- **Description**: ${description || "(none)"}`);
    parts.push(`- **Viewport**: ${viewportWidth}x${viewportHeight}\n`);
    parts.push(`### Performance`);
    parts.push(`- **Load time**: ${pageData.loadTime}ms`);
    parts.push(`- **Resources**: ${pageData.resourceCount}`);
    parts.push(`- **DOM nodes**: ${pageData.domNodes}\n`);
    parts.push(`### Component Structure`);
    parts.push("```json\n" + JSON.stringify(pageData.structure, null, 2) + "\n```\n");
    parts.push(`### Accessibility Tree`);
    parts.push("```\n" + a11yTree + "\n```\n");

    if (screenshotBase64) {
      parts.push(`### Screenshot (base64 PNG)`);
      parts.push("```\n" + screenshotBase64.slice(0, 200) + "... (truncated in display, full data available)\n```");
      parts.push(`\nFull screenshot: ${screenshotBase64.length} chars base64`);
    }

    return { content: [{ type: "text", text: parts.join("\n") }] };
  } catch (err) {
    return error(`Page inspection failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await page.close().catch(() => {});
  }
}

function clamp(val: number | undefined, min: number, max: number, def: number): number {
  if (val === undefined || typeof val !== "number") return def;
  return Math.min(max, Math.max(min, val));
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
