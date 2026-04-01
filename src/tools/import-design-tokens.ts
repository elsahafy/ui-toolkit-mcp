import type { ToolResponse, NormalizedToken, TokenFormat, MergeStrategy } from "../lib/types.js";
import { setTokens, mergeTokens, getTokenCount } from "../lib/token-store.js";

const FORMATS = new Set(["figma-tokens", "style-dictionary", "css-custom-properties"]);
const STRATEGIES = new Set(["replace", "merge-overwrite", "merge-keep"]);

export async function handleImportDesignTokens(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const tokensJson = args.tokens_json as string | undefined;
  const format = args.format as string | undefined;

  if (!tokensJson || !format) {
    return error("Missing required parameters: tokens_json, format");
  }

  if (!FORMATS.has(format)) {
    return error(`Invalid format: ${format}. Must be one of: ${[...FORMATS].join(", ")}`);
  }

  const namespace = (args.namespace as string) || "";
  const strategy = ((args.merge_strategy as string) || "replace") as MergeStrategy;

  if (!STRATEGIES.has(strategy)) {
    return error(`Invalid merge_strategy: ${strategy}. Must be one of: ${[...STRATEGIES].join(", ")}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(tokensJson);
  } catch {
    return error("Invalid JSON in tokens_json. Please provide valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return error("tokens_json must be a JSON object.");
  }

  const tokenMap = parseTokens(parsed as Record<string, unknown>, format as TokenFormat, namespace);

  if (tokenMap.size === 0) {
    return error("No tokens found in the provided JSON. Check the format matches your data structure.");
  }

  if (strategy === "replace") {
    setTokens(tokenMap);
  } else {
    mergeTokens(tokenMap, strategy);
  }

  const categories = new Set<string>();
  for (const [, token] of tokenMap) {
    categories.add(token.category);
  }

  const samples = [...tokenMap.values()].slice(0, 5);

  const result = {
    imported: tokenMap.size,
    totalActive: getTokenCount(),
    strategy,
    categories: [...categories],
    samples: samples.map((t) => ({
      name: t.cssVariable,
      value: t.value,
      type: t.type,
      category: t.category,
    })),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

function parseTokens(
  obj: Record<string, unknown>,
  format: TokenFormat,
  namespace: string
): Map<string, NormalizedToken> {
  switch (format) {
    case "figma-tokens":
      return parseFigmaTokens(obj, namespace);
    case "style-dictionary":
      return parseStyleDictionary(obj, namespace);
    case "css-custom-properties":
      return parseCSSCustomProperties(obj, namespace);
  }
}

function parseFigmaTokens(
  obj: Record<string, unknown>,
  namespace: string,
  path: string[] = []
): Map<string, NormalizedToken> {
  const tokens = new Map<string, NormalizedToken>();

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      if ("value" in record && typeof record.value === "string") {
        const fullPath = [...path, key];
        const name = fullPath.join("-");
        const prefix = namespace ? `--${namespace}-${name}` : `--${name}`;
        tokens.set(prefix, {
          name,
          cssVariable: prefix,
          value: record.value as string,
          type: (record.type as string) || inferType(record.value as string),
          category: inferCategory(fullPath),
          description: (record.description as string) || "",
        });
      } else {
        const nested = parseFigmaTokens(record, namespace, [...path, key]);
        for (const [k, v] of nested) tokens.set(k, v);
      }
    }
  }

  return tokens;
}

function parseStyleDictionary(
  obj: Record<string, unknown>,
  namespace: string
): Map<string, NormalizedToken> {
  const root = (obj.properties ?? obj.tokens ?? obj) as Record<string, unknown>;
  return parseFigmaTokens(root, namespace);
}

function parseCSSCustomProperties(
  obj: Record<string, unknown>,
  namespace: string
): Map<string, NormalizedToken> {
  const tokens = new Map<string, NormalizedToken>();

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== "string") continue;
    const cssVar = key.startsWith("--") ? key : `--${key}`;
    const prefixed = namespace ? cssVar.replace("--", `--${namespace}-`) : cssVar;
    const name = prefixed.replace(/^--/, "");

    tokens.set(prefixed, {
      name,
      cssVariable: prefixed,
      value,
      type: inferType(value),
      category: inferCategory(name.split("-")),
      description: "",
    });
  }

  return tokens;
}

function inferType(value: string): string {
  if (/^#[0-9a-f]{3,8}$/i.test(value) || /^(?:rgb|hsl)a?\(/i.test(value)) return "color";
  if (/^\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)$/.test(value)) return "dimension";
  if (/^\d+(?:\.\d+)?$/.test(value)) return "number";
  if (/^(?:normal|bold|\d{3})$/.test(value)) return "fontWeight";
  return "other";
}

function inferCategory(path: string[]): string {
  const joined = path.join("-").toLowerCase();
  if (/color|colour|bg|background|foreground|text-color|border-color/.test(joined)) return "color";
  if (/spacing|gap|margin|padding|space/.test(joined)) return "spacing";
  if (/font|typography|text|line-height|letter-spacing/.test(joined)) return "typography";
  if (/radius|border-radius|rounded/.test(joined)) return "borderRadius";
  if (/shadow|elevation/.test(joined)) return "shadow";
  if (/size|width|height/.test(joined)) return "sizing";
  if (/opacity|alpha/.test(joined)) return "opacity";
  return "other";
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
