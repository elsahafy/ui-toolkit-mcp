import { describe, it, expect, beforeEach } from "vitest";
import { getTokens, setTokens, mergeTokens, clearTokens, getTokenCount, getTokensAsJSON, getTokensAsCSS } from "../../src/lib/token-store.js";
import type { NormalizedToken } from "../../src/lib/types.js";

function makeToken(name: string, value: string): NormalizedToken {
  return { name, cssVariable: `--${name}`, value, type: "color", category: "color", description: "" };
}

describe("token-store", () => {
  beforeEach(() => clearTokens());

  it("starts empty", () => {
    expect(getTokenCount()).toBe(0);
    expect(getTokens().size).toBe(0);
  });

  it("sets and gets tokens", () => {
    const tokens = new Map([["--primary", makeToken("primary", "#000")]]);
    setTokens(tokens);
    expect(getTokenCount()).toBe(1);
    expect(getTokens().get("--primary")?.value).toBe("#000");
  });

  it("returns immutable copy", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    const t1 = getTokens();
    setTokens(new Map([["--b", makeToken("b", "#222")]]));
    // t1 should still have --a, not --b
    expect(t1.has("--a")).toBe(true);
    expect(t1.has("--b")).toBe(false);
  });

  it("merges with overwrite strategy", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    mergeTokens(new Map([["--a", makeToken("a", "#222")], ["--b", makeToken("b", "#333")]]), "merge-overwrite");
    expect(getTokens().get("--a")?.value).toBe("#222");
    expect(getTokens().get("--b")?.value).toBe("#333");
  });

  it("merges with keep strategy", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    mergeTokens(new Map([["--a", makeToken("a", "#222")], ["--b", makeToken("b", "#333")]]), "merge-keep");
    expect(getTokens().get("--a")?.value).toBe("#111"); // kept original
    expect(getTokens().get("--b")?.value).toBe("#333");
  });

  it("merges with replace strategy", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    mergeTokens(new Map([["--b", makeToken("b", "#222")]]), "replace");
    expect(getTokens().has("--a")).toBe(false);
    expect(getTokens().get("--b")?.value).toBe("#222");
  });

  it("clears all tokens", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    clearTokens();
    expect(getTokenCount()).toBe(0);
  });

  it("getTokensAsJSON returns valid JSON", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    const json = JSON.parse(getTokensAsJSON());
    expect(json["--a"].value).toBe("#111");
  });

  it("getTokensAsCSS returns :root block", () => {
    setTokens(new Map([["--a", makeToken("a", "#111")]]));
    const css = getTokensAsCSS();
    expect(css).toContain(":root {");
    expect(css).toContain("--a: #111;");
  });
});
