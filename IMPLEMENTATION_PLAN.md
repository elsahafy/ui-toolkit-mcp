# Implementation Plan: ui-toolkit-mcp

**74 items across 5 sprints** covering all audit findings, capability gaps, architecture improvements, and ecosystem integration.

---

## Sprint 1 — v1.1.0: Critical Fixes & Input Validation

**Goal**: Fix all 7 critical security/correctness bugs + 8 quick wins. Must complete before npm publish.

### S1.1 — Shared Input Validation Helper
**New file**: `src/lib/validation.ts` (~40 lines)
- `validateMaxLength(value: string, max: number, field: string): string | null`
- `validateIdentifier(name: string): string | null` — PascalCase, no spaces/special chars
- `sanitizeNamespace(ns: string): string` — strip non-alphanumeric/hyphen chars
- `validateBase64Png(b64: string): string | null` — check length + PNG signature

### S1.2 — Fix Browser Infrastructure
**Modify**: `src/lib/browser.ts`
- Add IPv6 private range blocking: `fc00:`, `fe80:`, `fd` prefix
- Add browser health check in `getBrowser()` — try `browser.version()`, catch and re-create
- Replace `process.on("exit")` with `SIGTERM`/`SIGINT` handlers using async cleanup
- Cache Playwright failure with a clear comment

### S1.3 — Fix Playwright Deprecation
**Modify**: `src/tools/inspect-page.ts`
- Replace `page.accessibility.snapshot()` with `page.locator('body').ariaSnapshot()` (Playwright 1.49+)
- Add version detection fallback for older Playwright

### S1.4 — Fix Visual Diff Crash
**Modify**: `src/tools/visual-diff.ts`
- Wrap `extractIdatData` loop in bounds check: validate `offset + 12 + len <= buf.length`
- Validate decompressed data length matches `height * stride`
- Replace dead `Buffer.from` try/catch with explicit base64 validation

### S1.5 — Fix Figma Styles Tool
**Modify**: `src/tools/extract-figma-styles.ts`
- When `node_ids` provided, fetch node data first, detect `styleType` from API response
- Add `AbortController` timeout (30s) to `safeFetch`
- Validate `figma_file_key` maxLength at runtime

### S1.6 — Fix Snyk Workflow
**Modify**: `.github/workflows/snyk.yml`
- Remove `|| true` from `snyk test`
- Add `continue-on-error: true` at step level (reports failure without blocking merge)

### S1.7 — Add Runtime Validation to All Handlers
**Modify**: All 7 tool handlers in `src/tools/`
- Import `validateMaxLength` from validation.ts
- Add checks for all string params with `maxLength` in schema
- Add `validateIdentifier` for `component_name` params
- Add `sanitizeNamespace` for namespace params

### S1.8 — Implement Variant Parameter
**Modify**: `src/lib/framework-templates.ts`
- Map variant to CSS: `outlined` → border, `filled` → background, `ghost` → transparent, `elevated` → box-shadow
- Apply variant styles in `buildCSS()`

### S1.9 — Fix tokensUsed Tracking
**Modify**: `src/lib/framework-templates.ts`
- Track which tokens are actually referenced during `buildTokenStyles()`
- Return only referenced token names in `ComponentOutput.tokensUsed`

### S1.10 — Add clear_tokens Tool
**New file**: `src/tools/clear-tokens.ts` (~25 lines)
- Calls `clearTokens()` from token-store
- Returns count of tokens that were cleared
**Modify**: `src/tools/index.ts` — register tool

### S1.11 — Fix buildTokenStyles Categories
**Modify**: `src/lib/framework-templates.ts`
- Include `borderRadius`, `shadow`, `sizing`, `opacity` categories in token CSS generation

**Acceptance**: All 7 critical issues resolved. `npm run build` passes. Server starts and all tools respond.

---

## Sprint 2 — v1.2.0: Testing & Code Quality

**Goal**: Add test suite (80%+ coverage), ESLint, fix all 16 medium issues and 10 low issues.

### S2.1 — Test Infrastructure
- Add `vitest` to devDependencies
- Add test script to `package.json`
- Add `vitest.config.ts`
- Add test CI job to `.github/workflows/ci.yml`
- Add ESLint + Prettier to devDependencies
- Replace fake lint job with actual ESLint run
- Add `"sourceMap": true` to tsconfig

### S2.2 — Library Unit Tests
| Test File | Target | Coverage |
|-----------|--------|----------|
| `tests/lib/token-store.test.ts` | set, get, merge (3 strategies), clear, immutability, getTokensAsJSON | 100% |
| `tests/lib/validation.test.ts` | maxLength, identifier, namespace, base64 validation | 100% |
| `tests/lib/accessibility-rules.test.ts` | Each of 12 rules with good + bad markup | 90%+ |
| `tests/lib/performance-rules.test.ts` | Each of 9 rules | 90%+ |
| `tests/lib/responsive-rules.test.ts` | Each of 8 rules | 90%+ |
| `tests/lib/framework-templates.test.ts` | All 5 frameworks, variant effect, token interpolation | 90%+ |
| `tests/lib/story-templates.test.ts` | Prop detection per framework, CSF3 output | 90%+ |
| `tests/lib/browser.test.ts` | validateUrl: valid URLs, private IPs, IPv6, non-HTTP | 100% |
| `tests/lib/pattern-library.test.ts` | Structure validation | 100% |

### S2.3 — Tool Handler Tests
| Test File | Target |
|-----------|--------|
| `tests/tools/generate-component.test.ts` | All frameworks, validation errors, token usage |
| `tests/tools/import-design-tokens.test.ts` | 3 formats, merge strategies, namespace, edge cases |
| `tests/tools/audit-component.test.ts` | Scoring, categories, framework param |
| `tests/tools/generate-story.test.ts` | Prop detection, CSF3 per framework |
| `tests/tools/visual-diff.test.ts` | Identical PNGs, diffs, corrupt PNGs, size mismatch |
| `tests/tools/clear-tokens.test.ts` | Clear + verify empty |
| `tests/tools/extract-figma-styles.test.ts` | Mock fetch, error handling, PAT sanitization |

### S2.4 — Fix Accessibility Rules
**Modify**: `src/lib/accessibility-rules.ts`
- `a11y-input-label`: Support `aria-labelledby`, `title`, wrapping `<label>` (no `for`)
- `a11y-color-only`: Check per-element scope, not global
- `a11y-button-text`: Fix operator precedence bug
- `a11y-no-role-on-custom`: Extend to `<section>`, `<span>` custom widgets

### S2.5 — Fix Performance Rules
**Modify**: `src/lib/performance-rules.ts`
- `perf-deep-nesting`: Handle self-closing `<div />` (JSX)
- `perf-no-key-in-list`: Use multiline regex, handle block body `.map()`

### S2.6 — Fix Responsive Rules
**Modify**: `src/lib/responsive-rules.ts`
- `resp-small-touch-target`: Extend to 30-43px range
- `resp-table-no-wrapper`: Match `style="overflow` pattern

### S2.7 — Fix Story Templates
**Modify**: `src/lib/story-templates.ts`
- `detectVueProps`: Handle nested generics with brace counting instead of `[^}]+`
- `detectAngularProps`: Add `input()` signal syntax (Angular 17+)
- `buildDefaultArgs`: Include required props with inferred defaults
- `buildReactStory`: Make play function generic (detect component's primary role)

### S2.8 — Fix Framework Templates
**Modify**: `src/lib/framework-templates.ts`
- Vue: Emit styles separately in `ComponentOutput.styles` instead of embedding only
- Angular: Fix blank line indentation in CSS
- `kebab()`: Handle consecutive capitals (MyUIComponent → my-ui-component)

### S2.9 — Auto-generate Audit Checklist
**Modify**: `src/lib/accessibility-rules.ts`, `performance-rules.ts`, `responsive-rules.ts`
- Export rule metadata array (id, description, severity, wcag) from each file
**Modify**: `src/resources/index.ts`
- Import rule metadata, generate checklist dynamically

### S2.10 — Clean Up Dead Code
**Modify**: `src/lib/types.ts`
- Remove `PageInspection` (unused) or use it in inspect-page.ts
- Remove `StoryOutput` (unused) or use it in generate-story.ts
**Modify**: `src/lib/token-store.ts`
- `getTokensAsCSS` — keep (will be used by export_tokens in S3)
- `clearTokens` — now used by clear_tokens tool
- Make `confidence` per-rule instead of per-module

### S2.11 — Fix Miscellaneous
- `inferCategory`: Distinguish `button-text-color` (color) from `heading-text` (typography)
- `inferType`: Handle weight 1000, `lighter`, `bolder`
- Pattern library: Add typed return interface
- Resource read: Remove double-wrap error
- Prompt: Escape triple backticks in markup, validate required args
- `visual-diff.ts`: Remove dead `Buffer.from` try/catch

**Acceptance**: 80%+ test coverage. ESLint passes. All medium/low issues resolved. CI runs tests.

---

## Sprint 3 — v1.3.0: New Capabilities

**Goal**: Add 5 new tools, 1 new resource, event-driven token store.

### S3.1 — export_tokens Tool
**New file**: `src/tools/export-tokens.ts`
- Parameters: `format` (enum: `css` | `json` | `style-dictionary`), `theme_name` (optional)
- `css`: Uses `getTokensAsCSS()` — :root block with custom properties
- `json`: Structured JSON with categories
- `style-dictionary`: Style Dictionary-compatible format for build pipeline

### S3.2 — responsive_preview Tool
**New file**: `src/tools/responsive-preview.ts`
- Parameters: `target_url`, `viewports` (optional array, default: `[{w:375,h:812},{w:768,h:1024},{w:1280,h:720}]`)
- Uses Playwright to screenshot at each viewport
- Returns metadata + base64 screenshots for each viewport
- Compares layout differences across breakpoints

### S3.3 — live_audit Tool
**New file**: `src/tools/live-audit.ts`
- Parameters: `target_url`, `categories`, `wcag_level`
- Orchestrates: `inspect_page` (get HTML + a11y tree) → `audit_component` (run rules on HTML)
- Returns combined report: page metadata + audit findings + score

### S3.4 — auto_fix_component Tool
**New file**: `src/tools/auto-fix-component.ts`
- Parameters: `markup`, `findings` (array of AuditFinding), `framework`
- Applies automated fixes based on finding IDs:
  - `a11y-img-alt` → add `alt=""`
  - `a11y-html-lang` → add `lang="en"`
  - `a11y-input-label` → add `aria-label`
  - `perf-img-no-lazy` → add `loading="lazy"`
  - `perf-img-no-dimensions` → add `width`/`height`
  - `resp-px-font-size` → convert px to rem
- Returns fixed markup + list of changes applied

### S3.5 — Audit-at-Generation-Time
**Modify**: `src/tools/generate-component.ts`
- New param: `auto_audit` (boolean, default: true)
- After generating, run `audit_component` on the output
- If critical findings, run `auto_fix_component`
- Return: component + audit report + fixes applied

### S3.6 — Server Health Resource
**Modify**: `src/resources/index.ts`
- New resource: `ui://server/health`
- Returns: version, tool count, token count, browser status, uptime, node version

### S3.7 — Tailwind CSS Output
**Modify**: `src/lib/framework-templates.ts`
- New param: `styling` enum: `css-modules` | `scoped` | `tailwind` | `inline`
- Tailwind: Use utility classes instead of CSS custom properties
- Map tokens to Tailwind classes where possible

### S3.8 — Event-Driven Token Store
**Modify**: `src/lib/token-store.ts`
- Add `subscribe(callback)` and `notify()` pattern
**Modify**: `src/index.ts`
- On token change, call `server.notification({ method: "notifications/resources/list_changed" })`

### S3.9 — Tests + Documentation
- Tests for all 5 new tools
- Update README with new tools
- Update CONTRIBUTING with new patterns
- Update SECURITY with live_audit URL handling

**Acceptance**: 15 total tools. Health resource working. Token events firing. 80%+ coverage maintained.

---

## Sprint 4 — v2.0.0: Major Enhancements

**Goal**: Competitive differentiators — axe-core, component registry, themes, design system validation, CSS-in-JS, composition, Figma components, CI config, docs generation, plugin system.

### S4.1 — axe-core Accessibility Testing
**New file**: `src/tools/accessibility-test.ts`
- Add `@axe-core/playwright` as optional peer dependency
- Parameters: `target_url`, `wcag_standard` (enum: `wcag2a` | `wcag2aa` | `wcag2aaa` | `best-practice`)
- Runs axe-core via Playwright on a live page
- Returns structured violations: impact, WCAG criteria, HTML snippet, fix suggestion
- Falls back to regex audit if axe-core not installed

### S4.2 — Component Registry
**New file**: `src/lib/component-registry.ts`
- In-memory registry of generated components
- Stores: name, framework, code, tokens used, audit score, timestamp
**New resource**: `ui://components/registry`
- Lists all generated components with metadata
**Modify**: `src/tools/generate-component.ts`
- Auto-register generated components

### S4.3 — Theme Management
**Modify**: `src/lib/token-store.ts`
- Support named token sets: `Map<string, Map<string, NormalizedToken>>`
- `setActiveTheme(name: string)`, `listThemes()`, `getActiveThemeName()`
**New tool**: `switch_theme`
- Parameters: `theme_name`
**Modify**: `src/tools/import-design-tokens.ts`
- Add `theme_name` param (default: "default")

### S4.4 — Design System Validation
**New file**: `src/tools/validate-design-system.ts`
- Parameters: `component_names` (array from registry)
- Checks: token usage consistency, naming conventions, spacing adherence, color palette compliance, typography scale compliance
- Returns: consistency score + findings per component

### S4.5 — CSS-in-JS Output Support
**Modify**: `src/lib/framework-templates.ts`
- Extend `styling` enum: add `styled-components` | `emotion`
- New template functions for each approach
- styled-components: Tagged template literals with token interpolation
- Emotion: `css` prop pattern with token variables

### S4.6 — Component Composition
**New file**: `src/tools/compose-layout.ts`
- Parameters: `components` (array of names from registry), `layout_description`, `framework`
- Generates a composed page with: imports, semantic structure, responsive grid, proper heading hierarchy, skip navigation

### S4.7 — Extract Figma Component Layouts
**New file**: `src/tools/extract-figma-component.ts`
- Parameters: `figma_file_key`, `figma_pat`, `node_id`, `framework`
- Reads a Figma frame node: auto-layout direction, padding, gap, alignment
- Maps to CSS flexbox/grid
- Generates a component matching the Figma layout with token bindings

### S4.8 — Generate CI Config
**New file**: `src/tools/generate-ci-config.ts`
- Parameters: `platform` (enum: `github-actions` | `gitlab-ci`), `tools` (array of tool names to run)
- Generates YAML workflow that runs audit_component + accessibility_test on PRs

### S4.9 — Generate Component Docs
**New file**: `src/tools/generate-component-docs.ts`
- Parameters: `component_name` (from registry), `format` (enum: `mdx` | `markdown`)
- Produces: description, prop table, usage examples, accessibility notes, audit results, related tokens

### S4.10 — Custom Audit Rule Plugin System
**New file**: `src/lib/rule-loader.ts`
- Load custom rules from JSON config or `.ui-toolkit-rules.json`
- Each rule: id, pattern (regex string), message, suggestion, severity, category
- Merge custom rules with built-in rules at startup

### S4.11 — Tests + Documentation
- Tests for all new tools (mock axe-core, Figma API)
- Update README, CONTRIBUTING, SECURITY
- Migration guide from v1.x to v2.0

**Acceptance**: 18 total tools. 5 resources. Theme support. axe-core integration. Plugin system. 80%+ coverage.

---

## Sprint 5 — v2.1.0: Polish & Ecosystem

**Goal**: Production hardening, ecosystem integration, developer experience.

### S5.1 — Registry & Discovery
- Update `server.json` with all 18 tools, 5 resources, 3 prompts
- Submit to Smithery MCP registry
- Submit to mcp.run
- Submit to glama.ai
- Submit to AgentSeal for security scoring
- Verify Socket.dev GitHub App integration

### S5.2 — GitHub Project Templates
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `CHANGELOG.md` with full version history

### S5.3 — Supply Chain Security
- Add npm provenance (`--provenance` flag in publish CI)
- Add GitHub Dependabot config (`dependabot.yml`)
- Add CodeQL analysis workflow for static code scanning
- Pin all GitHub Action versions to SHA hashes

### S5.4 — Performance & Reliability
- Benchmark response times for all 18 tools
- Memory profiling for long-running server (especially browser tools)
- Add rate limiting on browser tools (max 5 concurrent pages)
- Add page pool recycling (close pages after 60s idle)
- Visual diff: chunk pixel comparison to avoid blocking event loop

### S5.5 — Documentation & Examples
- Comprehensive README with all 18 tools documented
- Graceful degradation guide (with/without Playwright, with/without Figma PAT, with/without axe-core)
- Example repository: demo project with Claude Desktop config
- Video walkthrough / GIF demos
- API reference documentation (auto-generated from tool schemas)

**Acceptance**: Published on npm with provenance. Listed on 3+ MCP registries. AgentSeal scored. Full documentation. Performance benchmarked.

---

## Summary

| Sprint | Version | Items | New Tools | Total Tools | Est. Hours |
|--------|---------|-------|-----------|-------------|-----------|
| 1 | v1.1.0 | 11 | 1 | 8 | 4-6 |
| 2 | v1.2.0 | 31 | 0 | 8 | 8-12 |
| 3 | v1.3.0 | 10 | 5 | 13 | 6-10 |
| 4 | v2.0.0 | 12 | 8 | 18* | 16-24 |
| 5 | v2.1.0 | 15 | 0 | 18 | 8-12 |
| **Total** | | **74** | **14** | **18** | **42-64** |

*\*Sprint 4 adds 8 new tools but some are utility tools (generate_ci_config, generate_component_docs, switch_theme) bringing the total to 18.*

### Final Server State (v2.1.0)

**18 tools** | **5 resources** | **3 prompts** | **29+ audit rules** | **5 frameworks** | **6 styling options** | **3 token formats** | **Theme support** | **axe-core integration** | **Plugin system**

The most comprehensive UI MCP server in the ecosystem.
