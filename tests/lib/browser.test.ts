import { describe, it, expect } from "vitest";
import { validateUrl } from "../../src/lib/browser.js";

describe("validateUrl", () => {
  it("accepts valid http URLs", () => {
    expect(validateUrl("http://example.com")).toBeNull();
    expect(validateUrl("https://example.com/path?q=1")).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(validateUrl("ftp://example.com")).toContain("Only http://");
    expect(validateUrl("file:///etc/passwd")).toContain("Only http://");
    expect(validateUrl("javascript:alert(1)")).not.toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(validateUrl("not a url")).toContain("Invalid URL");
    expect(validateUrl("")).toContain("Invalid URL");
  });

  it("blocks localhost", () => {
    expect(validateUrl("http://localhost")).toContain("blocked");
    expect(validateUrl("http://localhost:3000")).toContain("blocked");
  });

  it("blocks 127.x", () => {
    expect(validateUrl("http://127.0.0.1")).toContain("blocked");
    expect(validateUrl("http://127.0.0.1:8080")).toContain("blocked");
  });

  it("blocks 10.x private IPs", () => {
    expect(validateUrl("http://10.0.0.1")).toContain("blocked");
    expect(validateUrl("http://10.255.255.255")).toContain("blocked");
  });

  it("blocks 172.16-31.x private IPs", () => {
    expect(validateUrl("http://172.16.0.1")).toContain("blocked");
    expect(validateUrl("http://172.31.255.255")).toContain("blocked");
  });

  it("allows 172.32.x (not private)", () => {
    expect(validateUrl("http://172.32.0.1")).toBeNull();
  });

  it("blocks 192.168.x", () => {
    expect(validateUrl("http://192.168.1.1")).toContain("blocked");
  });

  it("blocks 169.254.x link-local", () => {
    expect(validateUrl("http://169.254.1.1")).toContain("blocked");
  });

  it("blocks ::1 IPv6 loopback", () => {
    expect(validateUrl("http://[::1]")).toContain("blocked");
  });

  it("blocks IPv6 ULA (fc00::/7)", () => {
    expect(validateUrl("http://[fc00::1]")).toContain("blocked");
    expect(validateUrl("http://[fd12::1]")).toContain("blocked");
  });

  it("blocks IPv6 link-local (fe80::/10)", () => {
    expect(validateUrl("http://[fe80::1]")).toContain("blocked");
  });

  it("blocks 0.0.0.0", () => {
    expect(validateUrl("http://0.0.0.0")).toContain("blocked");
  });
});
