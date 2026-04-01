import type { Framework } from "./types.js";

// ========================================
// IN-MEMORY COMPONENT REGISTRY
// ========================================

export interface RegisteredComponent {
  readonly name: string;
  readonly framework: Framework;
  readonly markup: string;
  readonly tokensUsed: readonly string[];
  readonly auditScore: number | null;
  readonly timestamp: string;
}

let registry: Map<string, RegisteredComponent> = new Map();

export function registerComponent(component: RegisteredComponent): void {
  registry = new Map(registry);
  registry.set(component.name, component);
}

export function getComponent(name: string): RegisteredComponent | undefined {
  return registry.get(name);
}

export function listComponents(): readonly RegisteredComponent[] {
  return [...registry.values()];
}

export function getComponentCount(): number {
  return registry.size;
}

export function clearRegistry(): void {
  registry = new Map();
}

export function getRegistryAsJSON(): string {
  const entries = listComponents().map((c) => ({
    name: c.name,
    framework: c.framework,
    tokensUsed: c.tokensUsed.length,
    auditScore: c.auditScore,
    timestamp: c.timestamp,
  }));
  return JSON.stringify(entries, null, 2);
}
