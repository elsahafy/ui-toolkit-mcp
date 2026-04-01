import type { ToolResponse, Framework } from "../lib/types.js";
import { listComponents, getComponent } from "../lib/component-registry.js";
import { validateMaxLength } from "../lib/validation.js";

const FRAMEWORKS = new Set(["react", "vue", "svelte", "angular", "web-components"]);

export async function handleComposeLayout(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const componentNames = args.component_names as string[] | undefined;
  const layoutDescription = args.layout_description as string | undefined;
  const framework = args.framework as string | undefined;

  if (!componentNames || !Array.isArray(componentNames) || componentNames.length === 0) {
    return error("Missing required parameter: component_names (array of component names from registry)");
  }

  if (!framework || !FRAMEWORKS.has(framework)) {
    return error(`Invalid or missing framework. Must be one of: ${[...FRAMEWORKS].join(", ")}`);
  }

  if (layoutDescription) {
    const lenErr = validateMaxLength(layoutDescription, 2000, "layout_description");
    if (lenErr) return error(lenErr);
  }

  const registered = listComponents();
  const found: string[] = [];
  const missing: string[] = [];

  for (const name of componentNames) {
    if (getComponent(name)) {
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  if (missing.length > 0 && found.length === 0) {
    return error(
      `No components found in registry. Available: ${registered.map((c) => c.name).join(", ") || "(empty)"}. Generate components first.`
    );
  }

  const fw = framework as Framework;
  const imports = found.map((name) => buildImport(name, fw)).join("\n");
  const sections = found.map((name) => buildSection(name, fw)).join("\n      ");
  const missingNote = missing.length > 0
    ? `\n{/* Components not in registry: ${missing.join(", ")} — generate them first */}`
    : "";

  const layout = buildPageLayout(imports, sections, missingNote, fw, layoutDescription || "Page layout");

  const parts: string[] = [];
  parts.push(`## Composed Layout (${fw})\n`);
  parts.push(`**${found.length} components** composed${missing.length > 0 ? ` (${missing.length} missing)` : ""}\n`);
  parts.push("### Page Layout");
  parts.push("```" + fileExt(fw) + "\n" + layout + "\n```");

  return { content: [{ type: "text", text: parts.join("\n") }] };
}

function buildImport(name: string, fw: Framework): string {
  switch (fw) {
    case "react": return `import { ${name} } from "./${name}";`;
    case "vue": return `import ${name} from "./${name}.vue";`;
    case "svelte": return `import ${name} from "./${name}.svelte";`;
    case "angular": return `import { ${name}Component } from "./${kebab(name)}.component";`;
    case "web-components": return `import "./${kebab(name)}";`;
  }
}

function buildSection(name: string, fw: Framework): string {
  switch (fw) {
    case "react": return `<${name} />`;
    case "vue": return `<${name} />`;
    case "svelte": return `<${name} />`;
    case "angular": return `<app-${kebab(name)} />`;
    case "web-components": return `<${kebab(name)}></${kebab(name)}>`;
  }
}

function buildPageLayout(imports: string, sections: string, missingNote: string, fw: Framework, description: string): string {
  if (fw === "react") {
    return `${imports}

/**
 * ${description}
 */
export function Page() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header role="banner">
        {/* Header content */}
      </header>
      <main id="main-content">
        ${sections}
      </main>
      <footer role="contentinfo">
        {/* Footer content */}
      </footer>${missingNote}
    </>
  );
}`;
  }

  if (fw === "vue") {
    return `<script setup lang="ts">
${imports}
</script>

<template>
  <!-- ${description} -->
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header role="banner">
    <!-- Header content -->
  </header>
  <main id="main-content">
    ${sections}
  </main>
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>${missingNote}
</template>`;
  }

  // Generic fallback for svelte/angular/web-components
  return `${imports}

<!-- ${description} -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<header role="banner">
  <!-- Header content -->
</header>
<main id="main-content">
  ${sections}
</main>
<footer role="contentinfo">
  <!-- Footer content -->
</footer>${missingNote}`;
}

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").toLowerCase();
}

function fileExt(fw: Framework): string {
  switch (fw) {
    case "react": return "tsx";
    case "vue": return "vue";
    case "svelte": return "svelte";
    case "angular": return "typescript";
    case "web-components": return "html";
  }
}

function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
