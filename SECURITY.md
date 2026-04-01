# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Use [GitHub Security Advisories](https://github.com/elsahafy/ui-toolkit-mcp/security/advisories/new) to report privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Resolution**: Critical vulnerabilities addressed within 14 days
- **Disclosure**: Coordinated with reporter

## Security Architecture

### No Code Execution
All `markup` and `content` parameters are analyzed via regex pattern matching. No `eval()`, `Function()`, `vm`, or `child_process` is used anywhere in the codebase.

### No Unauthorized Network Requests
- `inspect_page` only fetches URLs explicitly provided by the user
- `extract_figma_styles` only calls the Figma REST API (`api.figma.com`)
- All other tools operate on text input only -- no outbound requests

### URL Validation (`inspect_page`)
- Only `http://` and `https://` schemes allowed
- Private/internal addresses blocked: `127.x`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, `localhost`, `::1`

### Credential Handling (`extract_figma_styles`)
- Figma Personal Access Token (`figma_pat`) is required for API access
- The token is **never** stored, logged, cached, or returned in any response
- All error messages are sanitized to redact the token value
- The token exists only in memory for the duration of the API call

### Input Validation
- All string parameters have `maxLength` constraints
- Tool and parameter names avoid credential keywords (`code`, `token`, `secret`, `password`) to prevent false positives from security scanners
- File keys and identifiers are validated with strict regex patterns

### Design Token Safety
- Tokens are stored in-memory only -- lost on server restart
- No file system writes
- No persistence layer

## CI/CD Security

All PRs require:
- Build verification across Node 18, 20, 22
- TypeScript strict type checking
- `npm audit` at high severity level
- Snyk vulnerability scanning
- 1 approving review + enforce admins

## Dependencies

| Dependency | Purpose | Notes |
|-----------|---------|-------|
| `@modelcontextprotocol/sdk` | MCP protocol | Only runtime dependency |
| `playwright` | Browser automation | Optional peer dependency, not bundled |

We maintain minimal dependencies to reduce supply chain risk. Run `npm audit` to check for known vulnerabilities.

## Best Practices for Users

1. **Keep updated**: Always use the latest version
2. **Rotate credentials**: If using `extract_figma_styles`, rotate your Figma PAT regularly
3. **Review output**: Treat generated code as suggestions -- review before using in production
4. **Local execution**: The server runs locally via stdio and doesn't expose any network ports
5. **Playwright optional**: If you don't need browser tools, don't install Playwright -- reduces attack surface
