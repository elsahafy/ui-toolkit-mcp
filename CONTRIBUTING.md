# Contributing to UI Toolkit MCP Server

Thanks for your interest in contributing! This guide covers everything you need to get started.

## How to Contribute

### Reporting Bugs

- Check [existing issues](https://github.com/elsahafy/ui-toolkit-mcp/issues) first
- Include: steps to reproduce, expected vs actual behavior, Node version, MCP client used
- Use the bug report template if available

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the use case and why it would be useful
- Include examples from other tools if applicable

### Contributing Code

Areas where help is welcome:

- **New tools** -- additional MCP tools for UI analysis or generation
- **New audit rules** -- accessibility, performance, or responsive checks
- **Framework support** -- improve generated output for specific frameworks
- **Pattern library** -- add more component patterns
- **Bug fixes** -- fix reported issues
- **Documentation** -- improve README, examples, or code comments

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm
- Git
- TypeScript knowledge
- Familiarity with MCP (Model Context Protocol)

### Getting Started

1. **Fork** the repository on GitHub

2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ui-toolkit-mcp.git
   cd ui-toolkit-mcp
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build**:
   ```bash
   npm run build
   ```

5. **Optional -- install Playwright** (for browser tools):
   ```bash
   npm install playwright
   npx playwright install chromium
   ```

## Project Structure

```
src/
  index.ts                    # Server entry point (thin orchestrator)
  lib/
    types.ts                  # Shared TypeScript interfaces
    token-store.ts            # In-memory design token state
    framework-templates.ts    # Component generators (5 frameworks)
    story-templates.ts        # Storybook CSF3 templates + prop detection
    accessibility-rules.ts    # WCAG audit rules
    performance-rules.ts      # Performance audit rules
    responsive-rules.ts       # Responsive design rules
    pattern-library.ts        # Component pattern library
    browser.ts                # Playwright lifecycle + URL validation
  tools/
    index.ts                  # Tool registry + dispatch
    generate-component.ts     # Component generation
    import-design-tokens.ts   # Token import (3 formats)
    audit-component.ts        # Markup auditing
    inspect-page.ts           # Browser page inspection
    visual-diff.ts            # PNG pixel comparison
    generate-story.ts         # Storybook story generation
    extract-figma-styles.ts   # Figma API integration
  resources/
    index.ts                  # Resource definitions + handlers
  prompts/
    index.ts                  # Prompt definitions + handlers
```

## Coding Standards

### TypeScript

- Strict mode enabled -- no `any` in application code
- Use explicit types on exported functions
- Use `readonly` on interface properties
- Use `as const` for literal types

### File Organization

- Each file under **200 lines**
- One tool handler per file in `src/tools/`
- Shared logic in `src/lib/`
- Types in `src/lib/types.ts`

### Code Quality

- Immutable data -- never mutate, always return new objects
- Handle errors explicitly -- every tool returns `{ isError: true }` on failure
- No `console.log` -- use `process.stderr.write` if absolutely needed
- No hardcoded secrets

### Security Rules

- No parameter named `code` or `url` (use `markup`, `target_url`, `content`)
- All string inputs must have `maxLength`
- Never log or return credential values (e.g., Figma PAT)
- URL validation: block private IPs and non-HTTP schemes
- No `eval()`, `Function()`, or `child_process`

## Contribution Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```

   Branch naming: `feat/`, `fix/`, `docs/`, `refactor/`

2. **Make your changes** following the coding standards above

3. **Build and verify**:
   ```bash
   npm run build
   ```

4. **Commit** using conventional commits:
   ```bash
   git commit -m "feat: add new audit rule for form validation"
   ```

   Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

5. **Push** and create a Pull Request

## Pull Request Process

### Before Submitting

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No new file exceeds 200 lines
- [ ] All string input params have `maxLength`
- [ ] No `any` types in new code
- [ ] Security rules followed (see above)
- [ ] Documentation updated if you changed tools, resources, or prompts

### Review Process

1. All 6 CI checks must pass (Build x3, Lint, Security Audit, Snyk)
2. At least 1 approving review required
3. Address any requested changes
4. Once approved, maintainer will merge

### Adding a New Tool

1. Create handler in `src/tools/your-tool.ts`
2. Add types to `src/lib/types.ts` if needed
3. Register in `src/tools/index.ts`:
   - Add import
   - Add tool definition with `inputSchema`
   - Add dispatch case
4. Update `README.md` with the tool documentation

### Adding a New Audit Rule

1. Add rule to the appropriate file:
   - `src/lib/accessibility-rules.ts` (WCAG rules)
   - `src/lib/performance-rules.ts`
   - `src/lib/responsive-rules.ts`
2. Each rule needs: `id`, `test` function, `message`, `suggestion`, `severity`
3. Add the rule to the checklist in `src/resources/index.ts`

## Questions?

- Check existing [Issues](https://github.com/elsahafy/ui-toolkit-mcp/issues)
- Create a new issue with the `question` label

Thank you for contributing!
