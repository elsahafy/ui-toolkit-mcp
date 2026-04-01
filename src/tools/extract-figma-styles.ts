import type { ToolResponse, NormalizedToken, MergeStrategy, FigmaColor } from "../lib/types.js";
import { setTokens, mergeTokens, getTokenCount } from "../lib/token-store.js";
import { validateMaxLength, sanitizeNamespace } from "../lib/validation.js";

const STRATEGIES = new Set(["replace", "merge-overwrite", "merge-keep"]);
const FILE_KEY_RE = /^[a-zA-Z0-9_-]+$/;
const FIGMA_API = "https://api.figma.com/v1";

export async function handleExtractFigmaStyles(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const fileKey = args.figma_file_key as string | undefined;
  const pat = args.figma_pat as string | undefined;

  if (!fileKey || !pat) {
    return error("Missing required parameters: figma_file_key, figma_pat");
  }

  const keyLenErr = validateMaxLength(fileKey, 100, "figma_file_key");
  if (keyLenErr) return error(keyLenErr);

  if (!FILE_KEY_RE.test(fileKey)) {
    return error("Invalid figma_file_key. Use the alphanumeric ID from the Figma file URL.");
  }

  const rawNamespace = (args.namespace as string) || "";
  const namespace = rawNamespace ? sanitizeNamespace(rawNamespace) : "";
  const strategy = ((args.merge_strategy as string) || "replace") as MergeStrategy;
  if (!STRATEGIES.has(strategy)) {
    return error(`Invalid merge_strategy: ${strategy}`);
  }

  const headers = { "X-Figma-Token": pat };

  // Step 1: Fetch published styles
  let styleNodes: { name: string; nodeId: string; styleType: string }[] = [];

  if (Array.isArray(args.node_ids)) {
    // When node_ids are provided, we detect the style type from the node data later
    styleNodes = (args.node_ids as string[]).map((id) => ({
      name: id, nodeId: id, styleType: "AUTO",
    }));
  } else {
    const stylesRes = await safeFetch(`${FIGMA_API}/files/${fileKey}/styles`, headers, pat);
    if (stylesRes.error) return error(stylesRes.error);

    const stylesData = stylesRes.data as { meta?: { styles?: { name: string; node_id: string; style_type: string }[] } };
    const styles = stylesData?.meta?.styles || [];
    styleNodes = styles.map((s) => ({
      name: s.name,
      nodeId: s.node_id,
      styleType: s.style_type,
    }));
  }

  if (styleNodes.length === 0) {
    return error("No published styles found in this Figma file. Publish styles in Figma first.");
  }

  // Step 2: Fetch node data
  const nodeIds = styleNodes.map((s) => s.nodeId).join(",");
  const nodesRes = await safeFetch(`${FIGMA_API}/files/${fileKey}/nodes?ids=${nodeIds}`, headers, pat);
  if (nodesRes.error) return error(nodesRes.error);

  const nodesData = nodesRes.data as { nodes?: Record<string, { document?: Record<string, unknown> }> };
  const nodes = nodesData?.nodes || {};

  // Step 3: Extract tokens
  const tokenMap = new Map<string, NormalizedToken>();
  let skipped = 0;

  for (const styleNode of styleNodes) {
    const nodeWrapper = nodes[styleNode.nodeId];
    const doc = nodeWrapper?.document as Record<string, unknown> | undefined;
    if (!doc) { skipped++; continue; }

    const tokenName = sanitizeName(styleNode.name);
    const prefix = namespace ? `--${namespace}-${tokenName}` : `--${tokenName}`;

    // Auto-detect type when node_ids were provided directly
    const resolvedType = styleNode.styleType === "AUTO" ? detectNodeType(doc) : styleNode.styleType;

    if (resolvedType === "FILL") {
      const fills = doc.fills as { color?: FigmaColor }[] | undefined;
      const fill = fills?.[0];
      if (fill?.color) {
        tokenMap.set(prefix, {
          name: tokenName, cssVariable: prefix,
          value: figmaColorToCSS(fill.color),
          type: "color", category: "color", description: styleNode.name,
        });
      } else { skipped++; }
    } else if (resolvedType === "TEXT") {
      const style = doc.style as Record<string, unknown> | undefined;
      if (style) {
        const base = prefix;
        if (style.fontFamily) tokenMap.set(`${base}-font-family`, {
          name: `${tokenName}-font-family`, cssVariable: `${base}-font-family`,
          value: String(style.fontFamily), type: "fontFamily", category: "typography", description: styleNode.name,
        });
        if (style.fontSize) tokenMap.set(`${base}-font-size`, {
          name: `${tokenName}-font-size`, cssVariable: `${base}-font-size`,
          value: `${style.fontSize}px`, type: "dimension", category: "typography", description: styleNode.name,
        });
        if (style.fontWeight) tokenMap.set(`${base}-font-weight`, {
          name: `${tokenName}-font-weight`, cssVariable: `${base}-font-weight`,
          value: String(style.fontWeight), type: "fontWeight", category: "typography", description: styleNode.name,
        });
        if (style.lineHeightPx) tokenMap.set(`${base}-line-height`, {
          name: `${tokenName}-line-height`, cssVariable: `${base}-line-height`,
          value: `${style.lineHeightPx}px`, type: "dimension", category: "typography", description: styleNode.name,
        });
      } else { skipped++; }
    } else if (resolvedType === "EFFECT") {
      const effects = doc.effects as { type: string; color?: FigmaColor; offset?: { x: number; y: number }; radius?: number; spread?: number }[] | undefined;
      if (effects?.length) {
        const cssValues = effects.map(effectToCSS).filter(Boolean);
        if (cssValues.length > 0) {
          tokenMap.set(prefix, {
            name: tokenName, cssVariable: prefix,
            value: cssValues.join(", "), type: "shadow", category: "shadow", description: styleNode.name,
          });
        }
      } else { skipped++; }
    } else {
      skipped++;
    }
  }

  if (tokenMap.size === 0) {
    return error(`No tokens could be extracted. ${skipped} styles were skipped (unsupported or empty).`);
  }

  // Step 4: Load into store
  if (strategy === "replace") {
    setTokens(tokenMap);
  } else {
    mergeTokens(tokenMap, strategy);
  }

  const categories = new Set<string>();
  for (const [, t] of tokenMap) categories.add(t.category);
  const samples = [...tokenMap.values()].slice(0, 5);

  return {
    content: [{ type: "text", text: JSON.stringify({
      extracted: tokenMap.size,
      skipped,
      totalActive: getTokenCount(),
      strategy,
      categories: [...categories],
      samples: samples.map((t) => ({ name: t.cssVariable, value: t.value, type: t.type, category: t.category })),
    }, null, 2) }],
  };
}

// ========================================
// HELPERS
// ========================================

function sanitizeName(name: string): string {
  return name.replace(/[\/\s]+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().replace(/^-+|-+$/g, "");
}

function figmaColorToCSS(c: FigmaColor): string {
  const to255 = (v: number) => Math.round(v * 255);
  if (c.a < 1) return `rgba(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)}, ${c.a.toFixed(2)})`;
  return `#${to255(c.r).toString(16).padStart(2, "0")}${to255(c.g).toString(16).padStart(2, "0")}${to255(c.b).toString(16).padStart(2, "0")}`;
}

function effectToCSS(e: { type: string; color?: FigmaColor; offset?: { x: number; y: number }; radius?: number; spread?: number }): string {
  if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
    const inset = e.type === "INNER_SHADOW" ? "inset " : "";
    const color = e.color ? figmaColorToCSS(e.color) : "rgba(0,0,0,0.25)";
    return `${inset}${e.offset?.x ?? 0}px ${e.offset?.y ?? 0}px ${e.radius ?? 0}px ${e.spread ?? 0}px ${color}`;
  }
  if (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
    return `blur(${e.radius ?? 0}px)`;
  }
  return "";
}

function detectNodeType(doc: Record<string, unknown>): string {
  if (doc.style && typeof doc.style === "object") return "TEXT";
  if (Array.isArray(doc.effects) && (doc.effects as unknown[]).length > 0) return "EFFECT";
  if (Array.isArray(doc.fills)) return "FILL";
  return "FILL";
}

async function safeFetch(
  fetchUrl: string,
  headers: Record<string, string>,
  pat: string
): Promise<{ data?: unknown; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(fetchUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const status = res.status;
      if (status === 403) return { error: "Figma API returned 403. Check that your personal access token is valid and has access to this file." };
      if (status === 404) return { error: "Figma file not found. Check that the file key is correct." };
      if (status === 429) return { error: "Figma API rate limit reached. Please wait a moment and try again." };
      const body = await res.text().catch(() => "");
      return { error: `Figma API error (${status}): ${sanitizeError(body, pat)}` };
    }
    return { data: await res.json() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Figma API request failed: ${sanitizeError(msg, pat)}` };
  }
}

function sanitizeError(message: string, pat: string): string {
  return message.replaceAll(pat, "[REDACTED]");
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
