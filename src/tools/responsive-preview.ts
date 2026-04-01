import type { ToolResponse } from "../lib/types.js";
import { validateUrl, getPlaywright, getBrowser, getInstallMessage } from "../lib/browser.js";
import { validateMaxLength } from "../lib/validation.js";

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const DEFAULT_VIEWPORTS: Viewport[] = [
  { name: "Mobile", width: 375, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1280, height: 720 },
];

export async function handleResponsivePreview(
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

  let browser;
  try {
    browser = await getBrowser();
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }

  const viewports = DEFAULT_VIEWPORTS;
  const results: { name: string; width: number; height: number; screenshotBase64: string }[] = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      const buffer = await page.screenshot({ type: "png" });
      results.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        screenshotBase64: buffer.toString("base64"),
      });
    } catch (err) {
      results.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        screenshotBase64: "",
      });
    } finally {
      await page.close().catch(() => {});
    }
  }

  const parts: string[] = [];
  parts.push(`## Responsive Preview: ${url}\n`);
  parts.push(`| Viewport | Size | Screenshot |`);
  parts.push(`|----------|------|------------|`);

  for (const r of results) {
    const status = r.screenshotBase64 ? `${r.screenshotBase64.length} chars base64` : "Failed";
    parts.push(`| ${r.name} | ${r.width}x${r.height} | ${status} |`);
  }

  parts.push("");
  for (const r of results) {
    if (r.screenshotBase64) {
      parts.push(`### ${r.name} (${r.width}x${r.height})`);
      parts.push("```\n" + r.screenshotBase64.slice(0, 100) + "...\n```\n");
    }
  }

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
