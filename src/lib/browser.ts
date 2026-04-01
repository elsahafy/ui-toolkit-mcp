// ========================================
// BROWSER LIFECYCLE & URL VALIDATION
// ========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let playwrightModule: any = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserInstance: any = null;

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0)/;

const PRIVATE_HOST_PATTERN =
  /^(localhost$|::1$|\[::1\]$)/i;

const PRIVATE_IPV6_PATTERN =
  /^(fc|fd|fe80)/i;

const INSTALL_MSG =
  "Playwright is not installed. Run: npm install playwright && npx playwright install chromium";

/**
 * Validate a URL for safety. Returns error message or null if valid.
 */
export function validateUrl(input: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return `Invalid URL: ${input}`;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return `Only http:// and https:// URLs are allowed. Got: ${parsed.protocol}`;
  }

  const host = parsed.hostname;

  if (PRIVATE_HOST_PATTERN.test(host)) {
    return `Private/internal addresses are blocked for security: ${host}`;
  }

  if (PRIVATE_IP_PATTERN.test(host)) {
    return `Private/internal addresses are blocked for security: ${host}`;
  }

  // IPv6 private ranges (ULA fc00::/7, link-local fe80::/10)
  const bare = host.replace(/^\[|\]$/g, "");
  if (PRIVATE_IPV6_PATTERN.test(bare)) {
    return `Private IPv6 addresses are blocked for security: ${host}`;
  }

  return null;
}

/**
 * Dynamically import Playwright. Returns the module or null.
 * Caches the result — null means "tried and failed".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPlaywright(): Promise<any | null> {
  if (playwrightModule !== undefined) return playwrightModule;

  try {
    // @ts-expect-error -- playwright is an optional peer dependency
    playwrightModule = await import("playwright");
    return playwrightModule;
  } catch {
    playwrightModule = null;
    return null;
  }
}

/**
 * Get or create a headless Chromium browser instance.
 * Includes health check — re-creates if the existing instance is dead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBrowser(): Promise<any> {
  if (browserInstance) {
    try {
      // Health check: if browser crashed, this throws
      await browserInstance.contexts();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  const pw = await getPlaywright();
  if (!pw) throw new Error(INSTALL_MSG);

  browserInstance = await pw.chromium.launch({ headless: true });
  return browserInstance;
}

/**
 * Close the browser instance if it exists.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}

/**
 * Get the Playwright install message.
 */
export function getInstallMessage(): string {
  return INSTALL_MSG;
}

// Cleanup on process signals
async function cleanup() {
  await closeBrowser();
  process.exit(0);
}

process.on("SIGTERM", () => { cleanup(); });
process.on("SIGINT", () => { cleanup(); });
