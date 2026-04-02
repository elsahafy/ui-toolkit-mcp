# UI Toolkit MCP Server

[![npm version](https://badge.fury.io/js/@elsahafy%2Fui-toolkit-mcp.svg)](https://www.npmjs.com/package/@elsahafy/ui-toolkit-mcp)
[![CI](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/ci.yml)
[![Snyk Security](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/snyk.yml/badge.svg)](https://github.com/elsahafy/ui-toolkit-mcp/actions/workflows/snyk.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/elsahafy/ui-toolkit-mcp/badge.svg)](https://snyk.io/test/github/elsahafy/ui-toolkit-mcp)
[![Socket](https://img.shields.io/badge/Socket-Supply_Chain_78%25-green)](https://socket.dev/npm/package/@elsahafy/ui-toolkit-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Full-stack UI toolkit MCP server: generate components, manage design tokens, audit markup, inspect live pages, compare screenshots, generate Storybook stories, and extract Figma styles -- across React, Vue, Svelte, Angular, and Web Components.

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

## Tools (7)

### Component Generation

#### `generate_component`
Generate production-ready UI components from natural language descriptions. Uses active design tokens if loaded.

```
"Generate a card component with image, title, description, and action buttons in React"
```

**Parameters:**
- `description` (required) -- What to build
- `framework` (required) -- `react` | `vue` | `svelte` | `angular` | `web-components`
- `component_name` (required) -- PascalCase name (e.g., `ProductCard`)
- `variant` -- `default` | `outlined` | `filled` | `ghost` | `elevated`
- `size` -- `sm` | `md` | `lg` | `xl`
- `include_styles` -- Include CSS (default: true)
- `include_tests` -- Generate test file (default: false)
- `responsive` -- Include breakpoints (default: true)

### Design Tokens

#### `import_design_tokens`
Import design tokens from Figma Tokens JSON, Style Dictionary, or CSS custom properties into the active store.

```
"Import these design tokens in Figma format"
```

**Parameters:**
- `tokens_json` (required) -- Raw JSON string of tokens
- `format` (required) -- `figma-tokens` | `style-dictionary` | `css-custom-properties`
- `namespace` -- Optional prefix (e.g., `brand`)
- `merge_strategy` -- `replace` | `merge-overwrite` | `merge-keep`

#### `extract_figma_styles`
Extract design tokens directly from a Figma file via the REST API. Extracts colors, typography, and effects.

```
"Extract design tokens from my Figma file"
```

**Parameters:**
- `figma_file_key` (required) -- Alphanumeric file key from Figma URL
- `figma_pat` (required) -- Figma Personal Access Token (never stored or logged)
- `node_ids` -- Optional specific nodes to extract
- `namespace` -- Optional CSS variable prefix
- `merge_strategy` -- How to handle existing tokens

### Auditing

#### `audit_component`
Audit markup for WCAG accessibility, performance, and responsive design issues. Returns scored findings with fix suggestions.

```
"Audit this component for accessibility issues"
```

**Parameters:**
- `markup` (required) -- HTML/JSX/Vue/Svelte markup
- `component_name` -- For report labeling
- `categories` -- `["accessibility", "performance", "responsive"]`
- `wcag_level` -- `A` | `AA` | `AAA`
- `framework` -- Affects how markup is parsed

**29 built-in rules:** 12 accessibility (WCAG), 9 performance, 8 responsive design.

### Browser Tools (Playwright)

> Requires optional Playwright dependency: `npm install playwright && npx playwright install chromium`

#### `inspect_page`
Navigate to a live URL and extract accessibility tree, component structure, performance metrics, and screenshot.

```
"Inspect the homepage for accessibility issues"
```

**Parameters:**
- `target_url` (required) -- HTTP/HTTPS URL (private IPs blocked)
- `viewport_width` / `viewport_height` -- Viewport size
- `wait_for` -- `load` | `domcontentloaded` | `networkidle`
- `timeout_ms` -- Navigation timeout
- `include_screenshot` -- Base64 PNG screenshot (default: true)

#### `visual_diff`
Pixel-by-pixel PNG comparison for visual regression testing. No Playwright required.

```
"Compare these two screenshots for visual differences"
```

**Parameters:**
- `before_image` (required) -- Base64 PNG
- `after_image` (required) -- Base64 PNG
- `threshold` -- Per-channel tolerance (0-255, default: 10)

### Storybook

#### `generate_story`
Auto-generate CSF3 Storybook stories with prop detection, play functions, and accessibility addon config.

```
"Generate Storybook stories for this React component"
```

**Parameters:**
- `component_code` (required) -- Full component source code
- `framework` (required) -- `react` | `vue` | `svelte` | `angular`
- `component_name` (required) -- PascalCase name
- `story_title` -- Storybook path (default: `Components/{name}`)

**Detects props via regex** from: TypeScript interfaces (React), `defineProps` (Vue), `export let` (Svelte), `@Input()` (Angular).

## Resources (3)

| URI | Description |
|-----|-------------|
| `ui://tokens/active` | Currently loaded design tokens |
| `ui://patterns/components` | Component pattern library (12 patterns with a11y requirements) |
| `ui://audit/checklist` | Full audit rule reference (29 rules) |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `build_page` | Generate a full page with multiple components using design tokens |
| `component_audit` | Comprehensive audit + fix workflow |
| `design_to_code` | Full Figma-to-code: extract tokens, generate components, audit, generate stories |

## Architecture

```
src/
  index.ts                          # Server entry (thin orchestrator)
  lib/
    types.ts                        # Shared TypeScript interfaces
    token-store.ts                  # In-memory design token state
    framework-templates.ts          # 5 framework component generators
    story-templates.ts              # CSF3 story templates + prop detection
    accessibility-rules.ts          # 12 WCAG audit rules
    performance-rules.ts            # 9 performance audit rules
    responsive-rules.ts             # 8 responsive design rules
    pattern-library.ts              # 12 component patterns
    browser.ts                      # Playwright lifecycle + URL validation
  tools/
    generate-component.ts
    import-design-tokens.ts
    audit-component.ts
    inspect-page.ts
    visual-diff.ts
    generate-story.ts
    extract-figma-styles.ts
    index.ts                        # Tool registry + dispatch
  resources/
    index.ts
  prompts/
    index.ts
```

## Security

- No code execution -- all `markup`/`content` parameters are analyzed via regex, never evaluated
- URL validation blocks private IPs (127.x, 10.x, 172.16-31.x, 192.168.x, localhost)
- Only HTTP/HTTPS schemes allowed for `inspect_page`
- Figma PAT is never stored, logged, or returned in responses
- All string inputs have `maxLength` constraints
- No credential keywords in resource URIs

## License

MIT
