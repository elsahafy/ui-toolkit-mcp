// ========================================
// SHARED INPUT VALIDATION
// ========================================

const IDENTIFIER_RE = /^[A-Z][a-zA-Z0-9]*$/;
const NAMESPACE_RE = /[^a-zA-Z0-9-]/g;

export function validateMaxLength(
  value: string | undefined,
  maxLen: number,
  field: string
): string | null {
  if (typeof value !== "string") return null;
  if (value.length > maxLen) {
    return `${field} exceeds maximum length of ${maxLen} characters (got ${value.length})`;
  }
  return null;
}

export function validateIdentifier(name: string): string | null {
  if (!IDENTIFIER_RE.test(name)) {
    return `Invalid identifier "${name}". Must be PascalCase with no spaces or special characters (e.g., "ProductCard").`;
  }
  return null;
}

export function sanitizeNamespace(ns: string): string {
  return ns.replace(NAMESPACE_RE, "").toLowerCase();
}

export function validateBase64(b64: string, field: string): string | null {
  if (b64.length === 0) return `${field} is empty`;
  if (/[^A-Za-z0-9+/=]/.test(b64)) return `${field} contains invalid base64 characters`;
  return null;
}
