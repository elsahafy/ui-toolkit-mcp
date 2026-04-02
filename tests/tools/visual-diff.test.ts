import { describe, it, expect } from "vitest";
import { handleVisualDiff } from "../../src/tools/visual-diff.js";

describe("visual_diff", () => {
  it("requires both images", async () => {
    const result = await handleVisualDiff({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing required");
  });

  it("rejects invalid base64", async () => {
    const result = await handleVisualDiff({
      before_image: "not valid base64!!",
      after_image: "also not valid!!",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("invalid base64");
  });

  it("rejects non-PNG data", async () => {
    const notPng = Buffer.from("this is not a png file at all").toString("base64");
    const result = await handleVisualDiff({
      before_image: notPng,
      after_image: notPng,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not a valid PNG");
  });

  it("enforces maxLength on images", async () => {
    const huge = "A".repeat(50_000_001);
    const result = await handleVisualDiff({
      before_image: huge,
      after_image: huge,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds maximum");
  });

  it("handles empty strings", async () => {
    const result = await handleVisualDiff({
      before_image: "",
      after_image: "",
    });
    expect(result.isError).toBe(true);
  });
});
