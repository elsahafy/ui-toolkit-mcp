// ========================================
// BROWSER LIFECYCLE & URL VALIDATION
// ========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let playwrightModule: any = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserInstance: any = null;

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|localhost$|::1$|\[::1\]$)/i;

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

  if (PRIVATE_IP_PATTERN.test(parsed.hostname)) {
    return `Private/internal addresses are blocked for security: ${parsed.hostname}`;
  }

  return null;
}

/**
 * Dynamically import Playwright. Returns the module or null.
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBrowser(): Promise<any> {
  if (browserInstance) return browserInstance;

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

// Cleanup on process exit
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close().catch(() => {});
  }
});
