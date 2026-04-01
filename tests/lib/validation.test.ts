import { describe, it, expect } from "vitest";
import { validateMaxLength, validateIdentifier, sanitizeNamespace, validateBase64 } from "../../src/lib/validation.js";

describe("validateMaxLength", () => {
  it("returns null for strings within limit", () => {
    expect(validateMaxLength("hello", 10, "field")).toBeNull();
  });

  it("returns error for strings exceeding limit", () => {
    expect(validateMaxLength("hello world", 5, "field")).toContain("exceeds maximum length");
  });

  it("returns null for undefined", () => {
    expect(validateMaxLength(undefined, 10, "field")).toBeNull();
  });

  it("returns null for exact length", () => {
    expect(validateMaxLength("abcde", 5, "field")).toBeNull();
  });
});

describe("validateIdentifier", () => {
  it("accepts PascalCase", () => {
    expect(validateIdentifier("ProductCard")).toBeNull();
    expect(validateIdentifier("Button")).toBeNull();
    expect(validateIdentifier("MyUIComponent")).toBeNull();
  });

  it("rejects lowercase start", () => {
    expect(validateIdentifier("productCard")).not.toBeNull();
  });

  it("rejects spaces", () => {
    expect(validateIdentifier("Product Card")).not.toBeNull();
  });

  it("rejects special characters", () => {
    expect(validateIdentifier("Product-Card")).not.toBeNull();
    expect(validateIdentifier("Product_Card")).not.toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateIdentifier("")).not.toBeNull();
  });
});

describe("sanitizeNamespace", () => {
  it("keeps alphanumeric and hyphens", () => {
    expect(sanitizeNamespace("my-brand")).toBe("my-brand");
  });

  it("strips special characters", () => {
    expect(sanitizeNamespace("my brand!@#")).toBe("mybrand");
  });

  it("lowercases", () => {
    expect(sanitizeNamespace("MyBrand")).toBe("mybrand");
  });
});

describe("validateBase64", () => {
  it("returns null for valid base64", () => {
    expect(validateBase64("SGVsbG8=", "field")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateBase64("", "field")).toContain("empty");
  });

  it("returns error for invalid characters", () => {
    expect(validateBase64("hello world!", "field")).toContain("invalid base64");
  });
});
