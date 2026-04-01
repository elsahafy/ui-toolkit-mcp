# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-04-02

### Added
- **Audit-at-generation-time**: `generate_component` now auto-audits output and reports findings inline
- **Component registry**: tracks all generated components with metadata (`ui://components/registry`)
- **6 new tools**: `clear_tokens`, `export_tokens`, `live_audit`, `auto_fix_component`, `responsive_preview`, `compose_layout`
- **Server health resource**: `ui://server/health`
- **Test suite**: 116 tests across 12 test files (vitest)
- **Input validation**: shared validation helper with `maxLength`, identifier, namespace, base64 checks
- **Dependabot**: automated dependency updates for npm and GitHub Actions
- **GitHub templates**: bug report, feature request, PR template

### Fixed
- Playwright `accessibility.snapshot()` deprecation (migrated to `ariaSnapshot()` with fallback)
- Browser singleton crash recovery with health check
- IPv6 private range blocking (fc00::/7, fe80::/10)
- SIGTERM/SIGINT cleanup for browser process
- `extractIdatData` bounds check preventing crash on corrupt PNGs
- `node_ids` in `extract_figma_styles` now auto-detects node type
- Snyk workflow `|| true` replaced with proper `continue-on-error`
- `variant` parameter now affects generated CSS (outlined, filled, ghost, elevated)
- `tokensUsed` now tracks actually used tokens instead of all loaded
- `component_name` validated as PascalCase identifier
- `namespace` sanitized for CSS safety
- `a11y-input-label` rule: supports `aria-labelledby`, `title`, wrapping labels
- `a11y-button-text` rule: fixed operator precedence
- `resp-small-touch-target` rule: extended to 30-43px range
- Dead types removed (`PageInspection`, `StoryOutput`)
- Audit checklist auto-generated from rule metadata (single source of truth)
- Token categories expanded to include `borderRadius`, `shadow`, `sizing`, `opacity`
- `kebab()` handles consecutive capitals correctly

### Changed
- **BREAKING**: Version bump from 1.0.0 to 2.0.0
- CI now runs tests alongside build
- Source maps enabled

## [1.0.0] - 2026-04-02

### Added
- Initial release with 7 tools, 3 resources, 2 prompts
- `generate_component`: React/Vue/Svelte/Angular/Web Components from natural language
- `import_design_tokens`: Figma Tokens, Style Dictionary, CSS custom properties
- `audit_component`: WCAG accessibility, performance, responsive design (29 rules)
- `inspect_page`: headless browser page inspection with a11y tree and screenshot
- `visual_diff`: pixel-by-pixel PNG comparison
- `generate_story`: CSF3 Storybook stories with prop detection
- `extract_figma_styles`: Figma REST API token extraction
- CI pipeline with GitHub Actions (Node 18/20/22)
- Snyk security scanning
- Branch protection with required checks
