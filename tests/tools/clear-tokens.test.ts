import { describe, it, expect, beforeEach } from "vitest";
import { handleClearTokens } from "../../src/tools/clear-tokens.js";
import { setTokens, clearTokens, getTokenCount } from "../../src/lib/token-store.js";
import type { NormalizedToken } from "../../src/lib/types.js";

describe("clear_tokens", () => {
  beforeEach(() => clearTokens());

  it("clears loaded tokens", async () => {
    const token: NormalizedToken = {
      name: "primary", cssVariable: "--primary", value: "#000",
      type: "color", category: "color", description: "",
    };
    setTokens(new Map([["--primary", token]]));
    expect(getTokenCount()).toBe(1);

    const result = await handleClearTokens({});
    expect(result.isError).toBeUndefined();
    expect(getTokenCount()).toBe(0);
    const data = JSON.parse(result.content[0].text);
    expect(data.cleared).toBe(1);
  });

  it("handles already empty store", async () => {
    const result = await handleClearTokens({});
    const data = JSON.parse(result.content[0].text);
    expect(data.cleared).toBe(0);
    expect(data.message).toContain("already empty");
  });
});
