import type { Framework, ComponentOutput, NormalizedToken, Variant, Size } from "./types.js";

// ========================================
// FRAMEWORK-SPECIFIC COMPONENT GENERATORS
// ========================================

interface GenerateParams {
  framework: Framework;
  componentName: string;
  description: string;
  variant: Variant;
  size: Size;
  tokens: ReadonlyMap<string, NormalizedToken>;
  includeStyles: boolean;
  responsive: boolean;
  includeTests: boolean;
}

const sizeMap: Record<Size, { padding: string; fontSize: string; gap: string }> = {
  sm: { padding: "0.5rem 0.75rem", fontSize: "0.875rem", gap: "0.5rem" },
  md: { padding: "0.75rem 1rem", fontSize: "1rem", gap: "0.75rem" },
  lg: { padding: "1rem 1.5rem", fontSize: "1.125rem", gap: "1rem" },
  xl: { padding: "1.25rem 2rem", fontSize: "1.25rem", gap: "1.25rem" },
};

function buildTokenStyles(tokens: ReadonlyMap<string, NormalizedToken>): string[] {
  const used: string[] = [];
  for (const [, token] of tokens) {
    if (token.category === "color" || token.category === "spacing" || token.category === "typography") {
      used.push(`  ${token.cssVariable}: ${token.value};`);
    }
  }
  return used;
}

function buildCSS(name: string, params: GenerateParams): string {
  const sizing = sizeMap[params.size];
  const tokenStyles = params.includeStyles ? buildTokenStyles(params.tokens) : [];
  const tokenBlock = tokenStyles.length > 0 ? `\n  /* Design Tokens */\n${tokenStyles.join("\n")}\n` : "";

  const responsiveBlock = params.responsive
    ? `\n\n@media (max-width: 768px) {\n  .${kebab(name)} {\n    padding: ${sizing.padding};\n    font-size: ${sizing.fontSize};\n  }\n}`
    : "";

  return `.${kebab(name)} {${tokenBlock}
  display: flex;
  flex-direction: column;
  gap: ${sizing.gap};
  padding: ${sizing.padding};
  font-size: ${sizing.fontSize};
  font-family: inherit;
  line-height: 1.5;
  color: var(--color-text, #1a1a1a);
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-md, 0.5rem);
}${responsiveBlock}`;
}

function kebab(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateReact(params: GenerateParams): ComponentOutput {
  const { componentName, description } = params;
  const css = buildCSS(componentName, params);

  const markup = `import React from "react";
import styles from "./${componentName}.module.css";

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

/**
 * ${description}
 */
export function ${componentName}({ children, className }: ${componentName}Props) {
  return (
    <div
      className={\`\${styles["${kebab(componentName)}"]}\${className ? \` \${className}\` : ""}\`}
      role="region"
      aria-label="${description}"
    >
      {children}
    </div>
  );
}`;

  const test = params.includeTests
    ? `import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ${componentName} } from "./${componentName}";

describe("${componentName}", () => {
  it("renders children", () => {
    render(<${componentName}>Test content</${componentName}>);
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(<${componentName} className="custom">Content</${componentName}>);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has accessible label", () => {
    render(<${componentName}>Content</${componentName}>);
    expect(screen.getByRole("region")).toBeDefined();
  });
});`
    : "";

  return { componentName, framework: "react", markup, styles: css, test, tokensUsed: getTokenNames(params.tokens) };
}

function generateVue(params: GenerateParams): ComponentOutput {
  const { componentName, description } = params;
  const css = buildCSS(componentName, params);

  const markup = `<script setup lang="ts">
/**
 * ${description}
 */
defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="['${kebab(componentName)}', $props.class]"
    role="region"
    aria-label="${description}"
  >
    <slot />
  </div>
</template>

<style scoped>
${css}
</style>`;

  return { componentName, framework: "vue", markup, styles: "", test: "", tokensUsed: getTokenNames(params.tokens) };
}

function generateSvelte(params: GenerateParams): ComponentOutput {
  const { componentName, description } = params;
  const css = buildCSS(componentName, params);

  const markup = `<script lang="ts">
  /**
   * ${description}
   */
  let className: string = "";
  export { className as class };
</script>

<div
  class="${kebab(componentName)} {className}"
  role="region"
  aria-label="${description}"
>
  <slot />
</div>

<style>
${css}
</style>`;

  return { componentName, framework: "svelte", markup, styles: "", test: "", tokensUsed: getTokenNames(params.tokens) };
}

function generateAngular(params: GenerateParams): ComponentOutput {
  const { componentName, description } = params;
  const css = buildCSS(componentName, params);
  const selector = kebab(componentName);

  const markup = `import { Component } from "@angular/core";

/**
 * ${description}
 */
@Component({
  selector: "app-${selector}",
  standalone: true,
  template: \`
    <div
      class="${kebab(componentName)}"
      role="region"
      aria-label="${description}"
    >
      <ng-content />
    </div>
  \`,
  styles: [\`
${css.split("\n").map((l) => "    " + l).join("\n")}
  \`],
})
export class ${componentName}Component {}`;

  return { componentName, framework: "angular", markup, styles: "", test: "", tokensUsed: getTokenNames(params.tokens) };
}

function generateWebComponent(params: GenerateParams): ComponentOutput {
  const { componentName, description } = params;
  const css = buildCSS(componentName, params);
  const tagName = kebab(componentName);

  const markup = `/**
 * ${description}
 * @element ${tagName}
 */
class ${componentName} extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const style = new CSSStyleSheet();
    style.replaceSync(\`
${css.split("\n").map((l) => "      " + l).join("\n")}
    \`);
    this.shadowRoot!.adoptedStyleSheets = [style];

    this.shadowRoot!.innerHTML = \`
      <div class="${tagName}" role="region" aria-label="${description}">
        <slot></slot>
      </div>
    \`;
  }
}

customElements.define("${tagName}", ${componentName});

export { ${componentName} };`;

  return { componentName, framework: "web-components", markup, styles: "", test: "", tokensUsed: getTokenNames(params.tokens) };
}

function getTokenNames(tokens: ReadonlyMap<string, NormalizedToken>): string[] {
  return [...tokens.values()].map((t) => t.cssVariable);
}

const generators: Record<Framework, (params: GenerateParams) => ComponentOutput> = {
  react: generateReact,
  vue: generateVue,
  svelte: generateSvelte,
  angular: generateAngular,
  "web-components": generateWebComponent,
};

export function generateComponentMarkup(params: GenerateParams): ComponentOutput {
  const generator = generators[params.framework];
  return generator(params);
}
