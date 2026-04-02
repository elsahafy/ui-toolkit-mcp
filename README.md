# UI Toolkit MCP Server

[![npm version](https://img.shields.io/npm/v/@elsahafy/ui-toolkit-mcp)](https://www.npmjs.com/package/@elsahafy/ui-toolkit-mcp)
[![CI](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-184_passing-brightgreen)](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/ci.yml)
[![Snyk Security](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/snyk.yml/badge.svg)](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/snyk.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/elsahafy/ui-toolkit-mcp/badge.svg)](https://snyk.io/test/github/elsahafy/ui-toolkit-mcp)
[![Socket](https://img.shields.io/badge/Socket-Supply_Chain_78%25-green)](https://socket.dev/npm/package/@elsahafy/ui-toolkit-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The most comprehensive UI MCP server available. 13 tools, 5 resources, 3 prompts for end-to-end UI development: generate components, manage design tokens, audit accessibility, auto-fix issues, inspect live pages, compare screenshots, generate Storybook stories, extract Figma styles, compose layouts, and preview responsive designs -- across React, Vue, Svelte, Angular, and Web Components.

**Works with any MCP-compatible client** including Claude Desktop, Claude Code, Cursor IDE, Continue.dev, Cline, and Zed.

## Installation

### npx (No Install)

```bash
npx -y @elsahafy/ui-toolkit-mcp
```

### npm (Global)

```bash
npm install -g @elsahafy/ui-toolkit-mcp
```

### Claude Code CLI

```bash
claude mcp add ui-toolkit -- npx -y @elsahafy/ui-toolkit-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ui-toolkit": {
      "command": "npx",
      "args": ["-y", "@elsahafy/ui-toolkit-mcp"]
    }
  }
}
```

### Cursor IDE

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ui-toolkit": {
      "command": "npx",
      "args": ["-y", "@elsahafy/ui-toolkit-mcp"]
    }
  }
}
```

### Optional: Browser Tools

For `inspect_page`, `live_audit`, and `responsive_preview`, install Playwright separately:

```bash
npm install playwright
npx playwright install chromium
```

All other tools work without Playwright.

## Tools (13)

### Component Generation

#### `generate_component`
Generate production-ready UI components from natural language. Automatically audits the output and reports issues inline.

```
"Generate a card component with image, title, and action buttons in React"
```

**Parameters:**
- `description` (required) -- What to build
- `framework` (required) -- `react` | `vue` | `svelte` | `angular` | `web-components`
- `component_name` (required) -- PascalCase name (e.g., `ProductCard`)
- `variant` -- `default` | `outlined` | `filled` | `ghost` | `elevated`
- `size` -- `sm` | `md` | `lg` | `xl`
- `auto_audit` -- Automatically audit generated output (default: true)
- `include_styles` -- Include CSS with design tokens (default: true)
- `include_tests` -- Generate test file (default: false)
- `responsive` -- Include breakpoints (default: true)

Generated components are automatically registered in the component registry.

#### `compose_layout`
Compose a full page layout from previously generated components in the registry.

```
"Compose a page from Hero, Features, and Footer components in React"
```

**Parameters:**
- `component_names` (required) -- Array of component names from the registry
- `framework` (required) -- Target framework
- `layout_description` -- Description of the page layout

Produces a complete page with imports, semantic structure (`<header>`, `<main>`, `<footer>`), and skip navigation.

### Design Tokens

#### `import_design_tokens`
Import design tokens from Figma Tokens JSON, Style Dictionary, or CSS custom properties.

**Parameters:**
- `tokens_json` (required) -- Raw JSON string of tokens
- `format` (required) -- `figma-tokens` | `style-dictionary` | `css-custom-properties`
- `namespace` -- Optional prefix (e.g., `brand`)
- `merge_strategy` -- `replace` | `merge-overwrite` | `merge-keep`

#### `extract_figma_styles`
Extract design tokens directly from a Figma file via the REST API.

**Parameters:**
- `figma_file_key` (required) -- Alphanumeric file key from Figma URL
- `figma_pat` (required) -- Figma Personal Access Token (never stored or logged)
- `node_ids` -- Optional specific nodes to extract
- `namespace` -- Optional CSS variable prefix
- `merge_strategy` -- How to handle existing tokens

#### `export_tokens`
Export the active token store as CSS custom properties, JSON, or Style Dictionary format.

**Parameters:**
- `format` -- `css` | `json` | `style-dictionary` (default: `css`)

#### `clear_tokens`
Clear all design tokens from the active store.

### Auditing & Fixing

#### `audit_component`
Audit markup for WCAG accessibility, performance, and responsive design issues. Returns scored findings with fix suggestions.

**Parameters:**
- `markup` (required) -- HTML/JSX/Vue/Svelte markup
- `component_name` -- For report labeling
- `categories` -- `["accessibility", "performance", "responsive"]`
- `wcag_level` -- `A` | `AA` | `AAA`
- `framework` -- Affects how markup is parsed

**29 built-in rules:** 12 accessibility (WCAG), 9 performance, 8 responsive design.

#### `auto_fix_component`
Automatically fix common accessibility and performance issues based on audit findings.

```
"Auto-fix the accessibility issues in this component"
```

**Parameters:**
- `markup` (required) -- The markup to fix
- `findings` (required) -- Array of AuditFinding objects from `audit_component`

**Supported auto-fixes:** missing alt text, missing lang attribute, missing lazy loading, positive tabindex, px font-sizes to rem.

#### `live_audit`
Navigate to a live URL and audit the rendered HTML. Combines browser inspection with markup auditing in one call. Requires Playwright.

**Parameters:**
- `target_url` (required) -- HTTP/HTTPS URL (private IPs blocked)
- `categories` -- Audit categories to run
- `wcag_level` -- WCAG conformance level

### Browser Tools (Playwright)

> Install separately: `npm install playwright && npx playwright install chromium`

#### `inspect_page`
Navigate to a live URL and extract accessibility tree, component structure, performance metrics, and screenshot.

**Parameters:**
- `target_url` (required) -- HTTP/HTTPS URL (private IPs blocked)
- `viewport_width` / `viewport_height` -- Viewport size
- `wait_for` -- `load` | `domcontentloaded` | `networkidle`
- `timeout_ms` -- Navigation timeout
- `include_screenshot` -- Base64 PNG screenshot (default: true)

#### `visual_diff`
Pixel-by-pixel PNG comparison for visual regression testing. No Playwright required.

**Parameters:**
- `before_image` (required) -- Base64 PNG
- `after_image` (required) -- Base64 PNG
- `threshold` -- Per-channel tolerance (0-255, default: 10)

#### `responsive_preview`
Screenshot a URL at mobile (375px), tablet (768px), and desktop (1280px) viewports. Requires Playwright.

**Parameters:**
- `target_url` (required) -- HTTP/HTTPS URL (private IPs blocked)

### Storybook

#### `generate_story`
Auto-generate CSF3 Storybook stories with prop detection, play functions, and accessibility addon config.

**Parameters:**
- `component_code` (required) -- Full component source code
- `framework` (required) -- `react` | `vue` | `svelte` | `angular`
- `component_name` (required) -- PascalCase name
- `story_title` -- Storybook path (default: `Components/{name}`)

**Detects props via regex** from: TypeScript interfaces (React), `defineProps` (Vue), `export let` (Svelte), `@Input()` (Angular).

## Resources (5)

| URI | Description |
|-----|-------------|
| `ui://tokens/active` | Currently loaded design tokens |
| `ui://patterns/components` | Component pattern library (12 patterns with a11y requirements) |
| `ui://components/registry` | Registry of all generated components with audit scores |
| `ui://server/health` | Server version, tool count, token count, uptime |
| `ui://audit/checklist` | Full audit rule reference (auto-generated from rule definitions) |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `build_page` | Generate a full page with multiple components using design tokens |
| `component_audit` | Comprehensive audit + fix workflow |
| `design_to_code` | Full Figma-to-code: extract tokens, generate components, audit, generate stories |

## Key Features

### Audit-at-Generation-Time
Every component generated by `generate_component` is automatically audited for accessibility, performance, and responsive issues. Critical findings are reported inline. No other UI MCP server does this.

### Component Registry
All generated components are tracked with metadata (framework, tokens used, audit score, timestamp). Use `compose_layout` to assemble them into full pages.

### Design Token Pipeline
Import tokens from Figma, Style Dictionary, or CSS custom properties. Export in any format. Tokens are automatically applied to generated components.

### Framework Agnostic
All 13 tools support React, Vue, Svelte, Angular, and Web Components. One server, any framework.

## Architecture

```
src/
  index.ts                          # Server entry (thin orchestrator)
  lib/
    types.ts                        # Shared TypeScript interfaces
    token-store.ts                  # In-memory design token state
    component-registry.ts           # Component tracking
    framework-templates.ts          # 5 framework component generators
    story-templates.ts              # CSF3 story templates + prop detection
    accessibility-rules.ts          # 12 WCAG audit rules
    performance-rules.ts            # 9 performance audit rules
    responsive-rules.ts             # 8 responsive design rules
    pattern-library.ts              # 12 component patterns
    browser.ts                      # Playwright lifecycle + URL validation
    validation.ts                   # Shared input validation
    utils.ts                        # Shared utilities (kebab, clamp, fileExt)
  tools/
    generate-component.ts           # + auto-audit + registry
    import-design-tokens.ts
    audit-component.ts
    auto-fix-component.ts
    inspect-page.ts
    visual-diff.ts
    generate-story.ts
    extract-figma-styles.ts
    export-tokens.ts
    clear-tokens.ts
    live-audit.ts
    responsive-preview.ts
    compose-layout.ts
    index.ts                        # Tool registry + dispatch
  resources/
    index.ts                        # 5 resources
  prompts/
    index.ts                        # 3 workflow prompts
tests/
  lib/                              # 11 library test files
  tools/                            # 12 tool test files
```

**184 tests** across 23 test files. All source files have dedicated test coverage.

## Security

- No code execution -- all `markup` parameters are analyzed via regex, never evaluated
- URL validation blocks private IPs (127.x, 10.x, 172.16-31.x, 192.168.x, fe80::, fc00::, localhost)
- Only HTTP/HTTPS schemes allowed for browser tools
- Figma PAT is never stored, logged, or returned in responses (sanitized from error messages)
- All string inputs have `maxLength` constraints enforced at runtime
- No credential keywords in resource URIs
- Input validation helper shared across all tool handlers

## License

MIT
