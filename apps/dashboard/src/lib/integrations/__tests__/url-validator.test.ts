import { describe, it, expect, vi } from "vitest";
import { isPrivateOrRestrictedIp, validateWebhookDestinationUrl } from "../url-validator";

describe("Anti-SSRF URL & IP Validator", () => {
  it("detects and blocks IPv4 loopback (127.0.0.0/8)", () => {
    expect(isPrivateOrRestrictedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrRestrictedIp("127.1.2.3")).toBe(true);
  });

  it("detects and blocks RFC 1918 private ranges (10.x, 172.16-31.x, 192.168.x)", () => {
    expect(isPrivateOrRestrictedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrRestrictedIp("172.16.0.1")).toBe(true);
    expect(isPrivateOrRestrictedIp("172.31.255.255")).toBe(true);
    expect(isPrivateOrRestrictedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrRestrictedIp("172.32.0.1")).toBe(false); // Public
  });

  it("detects and blocks Cloud Metadata IP (169.254.169.254)", () => {
    expect(isPrivateOrRestrictedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrRestrictedIp("169.254.1.1")).toBe(true);
  });

  it("detects and blocks IPv6 loopback and unique local addresses", () => {
    expect(isPrivateOrRestrictedIp("::1")).toBe(true);
    expect(isPrivateOrRestrictedIp("fc00::1")).toBe(true);
    expect(isPrivateOrRestrictedIp("fe80::1")).toBe(true);
  });

  it("allows benign public IP addresses", () => {
    expect(isPrivateOrRestrictedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrRestrictedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrRestrictedIp("104.26.10.12")).toBe(false);
  });

  it("rejects non-https protocol in production mode", async () => {
    const res = await validateWebhookDestinationUrl("http://my-api.com/webhook", { isProduction: true });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Only 'https:' is permitted");
  });

  it("rejects restricted port in production mode", async () => {
    const res = await validateWebhookDestinationUrl("https://my-api.com:22/webhook", { isProduction: true });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Port 22 is not allowed");
  });

  it("rejects private hostnames that resolve to localhost or metadata", async () => {
    const res = await validateWebhookDestinationUrl("http://127.0.0.1:3000/webhook", { isProduction: true });
    expect(res.isValid).toBe(false);
  });
});
