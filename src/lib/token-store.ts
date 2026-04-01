import type { NormalizedToken, MergeStrategy } from "./types.js";

// ========================================
// IN-MEMORY DESIGN TOKEN STORE
// ========================================

let tokens: ReadonlyMap<string, NormalizedToken> = new Map();

export function getTokens(): ReadonlyMap<string, NormalizedToken> {
  return tokens;
}

export function setTokens(newTokens: ReadonlyMap<string, NormalizedToken>): void {
  tokens = new Map(newTokens);
}

export function mergeTokens(
  incoming: ReadonlyMap<string, NormalizedToken>,
  strategy: MergeStrategy
): void {
  if (strategy === "replace") {
    tokens = new Map(incoming);
    return;
  }

  const merged = new Map(tokens);

  for (const [key, value] of incoming) {
    if (strategy === "merge-overwrite") {
      merged.set(key, value);
    } else if (strategy === "merge-keep") {
      if (!merged.has(key)) {
        merged.set(key, value);
      }
    }
  }

  tokens = merged;
}

export function clearTokens(): void {
  tokens = new Map();
}

export function getTokenCount(): number {
  return tokens.size;
}

export function getTokensAsJSON(): string {
  const obj: Record<string, { value: string; type: string; category: string }> = {};
  for (const [key, token] of tokens) {
    obj[key] = { value: token.value, type: token.type, category: token.category };
  }
  return JSON.stringify(obj, null, 2);
}

export function getTokensAsCSS(): string {
  const lines: string[] = [":root {"];
  for (const [, token] of tokens) {
    lines.push(`  ${token.cssVariable}: ${token.value};`);
  }
  lines.push("}");
  return lines.join("\n");
}
