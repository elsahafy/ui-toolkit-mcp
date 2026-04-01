import type { ToolResponse } from "../lib/types.js";
import { getTokens, getTokenCount, getTokensAsJSON, getTokensAsCSS } from "../lib/token-store.js";

const FORMATS = new Set(["css", "json", "style-dictionary"]);

export async function handleExportTokens(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const format = (args.format as string) || "css";

  if (!FORMATS.has(format)) {
    return error(`Invalid format: ${format}. Must be one of: ${[...FORMATS].join(", ")}`);
  }

  if (getTokenCount() === 0) {
    return error("No design tokens loaded. Import tokens first using import_design_tokens or extract_figma_styles.");
  }

  let output = "";
  let ext = "css";

  switch (format) {
    case "css":
      output = getTokensAsCSS();
      ext = "css";
      break;
    case "json":
      output = getTokensAsJSON();
      ext = "json";
      break;
    case "style-dictionary": {
      const tokens = getTokens();
      const sdTokens: Record<string, unknown> = {};
      for (const [, token] of tokens) {
        const parts = token.name.split("-");
        let current: Record<string, unknown> = sdTokens;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = {
          value: token.value,
          type: token.type,
          description: token.description,
        };
      }
      output = JSON.stringify(sdTokens, null, 2);
      ext = "json";
      break;
    }
  }

  const parts: string[] = [];
  parts.push(`## Exported Design Tokens (${format})\n`);
  parts.push(`**${getTokenCount()} tokens exported**\n`);
  parts.push("```" + ext + "\n" + output! + "\n```");

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
