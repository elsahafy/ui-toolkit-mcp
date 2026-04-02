import type { Framework } from "./types.js";

// ========================================
// SHARED UTILITIES
// ========================================

export function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function clamp(val: number | undefined, min: number, max: number, def: number): number {
  if (val === undefined || typeof val !== "number") return def;
  return Math.min(max, Math.max(min, val));
}

export function fileExt(framework: Framework): string {
  switch (framework) {
    case "react": return "tsx";
    case "vue": return "vue";
    case "svelte": return "svelte";
    case "angular": return "typescript";
    case "web-components": return "typescript";
  }
}
