/**
 * 🛡️ Hermes OS — Egress Security Guard & Anti-SSRF HTTP Client (K18-EGRESS-01)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/egress-guard.ts
 *
 * Implements Multi-Layer Network Defense for Tool Calling:
 * 1. Validates protocols (HTTP/HTTPS only, rejects embedded user:pass).
 * 2. Resolves and inspects ALL DNS IP addresses (IPv4 and IPv6).
 * 3. Blocks private, loopback, link-local, cloud metadata (169.254.169.254), and encoded IPs.
 * 4. Manual hop-by-hop redirect resolution (re-validates IP at every step to block DNS rebinding / redirect bypass).
 * 5. Applies hard timeouts and maximum payload size limits.
 */

import dns from 'node:dns';
import net from 'node:net';

export interface EgressValidationResult {
  allowed: boolean;
  reason?: string;
  resolvedIps?: string[];
  sanitizedUrl?: string;
}

export interface EgressGuardOptions {
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxRedirects?: number;
  timeoutMs?: number;
  maxSizeBytes?: number;
}

export class EgressGuard {
  private static readonly CLOUD_METADATA_IPS = new Set([
    '169.254.169.254',
    '169.254.170.2',
    'metadata.google.internal',
  ]);

  /**
   * Checks if an IPv4 address is in a private, loopback, or link-local range.
   */
  private static isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return true; // Invalid format -> block
    }

    const a = parts[0];
    const b = parts[1];
    if (a === undefined) return true;
    if (a === 127) return true;                         // 127.0.0.0/8 (Loopback)
    if (a === 10) return true;                          // 10.0.0.0/8 (Private)
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private)
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16 (Private)
    if (a === 169 && b === 254) return true;            // 169.254.0.0/16 (Link-local / Metadata)
    if (a === 0) return true;                           // 0.0.0.0/8 (Current network)
    if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 192 && b === 0 && parts[2] === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (a >= 224) return true;                          // 224.0.0.0/4 (Multicast / Reserved)

    return false;
  }

  /**
   * Checks if an IPv6 address is in a private, loopback, or link-local range.
   */
  private static isPrivateIPv6(ip: string): boolean {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true; // Loopback & Unspecified
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // Unique local (fc00::/7)
    if (normalized.startsWith('fe80:')) return true; // Link-local (fe80::/10)
    
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return this.isPrivateIPv4(ipv4Part);
      }
      return true;
    }

    return false;
  }

  /**
   * Evaluates an IP address (v4 or v6) against SSRF rules.
   */
  public static isRestrictedIP(ip: string): boolean {
    if (this.CLOUD_METADATA_IPS.has(ip)) return true;
    if (net.isIPv4(ip)) return this.isPrivateIPv4(ip);
    if (net.isIPv6(ip)) return this.isPrivateIPv6(ip);
    return true; // Unknown address family -> fail closed
  }

  /**
   * Detects hex, octal, or integer-encoded IP addresses in hostname.
   */
  private static isObfuscatedIP(hostname: string): boolean {
    // Decimal integer IP (e.g. 2130706433 for 127.0.0.1)
    if (/^\d+$/.test(hostname)) return true;
    // Hex encoded (e.g. 0x7f000001)
    if (/^0x[0-9a-fA-F]+$/i.test(hostname)) return true;
    // Octal encoded parts (e.g. 0177.0.0.1)
    if (/^0\d+\./.test(hostname)) return true;
    return false;
  }

  /**
   * Asynchronously validates a target URL against SSRF and Egress rules.
   */
  public static async validateUrl(
    targetUrl: string,
    options: EgressGuardOptions = {}
  ): Promise<EgressValidationResult> {
    // 0. Detect raw obfuscated IP patterns in the input URL before normalization
    const rawHostMatch = targetUrl.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
    const rawHost = rawHostMatch ? rawHostMatch[1]?.toLowerCase() : '';
    if (rawHost && this.isObfuscatedIP(rawHost)) {
      return { allowed: false, reason: 'OBFUSCATED_IP_FORBIDDEN' };
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return { allowed: false, reason: 'INVALID_URL_SYNTAX' };
    }

    // 1. Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { allowed: false, reason: `UNSUPPORTED_PROTOCOL: ${parsed.protocol}` };
    }

    // 2. Reject embedded user/pass
    if (parsed.username || parsed.password) {
      return { allowed: false, reason: 'EMBEDDED_CREDENTIALS_FORBIDDEN' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 3. Direct IP check (IPv4 or IPv6)
    if (net.isIP(hostname)) {
      if (this.isRestrictedIP(hostname)) {
        return { allowed: false, reason: `RESTRICTED_IP_DESTINATION: ${hostname}` };
      }
      return { allowed: true, resolvedIps: [hostname], sanitizedUrl: parsed.toString() };
    }

    // 4. Domain denylist / local name check
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      this.CLOUD_METADATA_IPS.has(hostname)
    ) {
      return { allowed: false, reason: 'RESTRICTED_HOSTNAME' };
    }

    // 5. Allowed domains whitelist check (if specified)
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      const isDomainAllowed = options.allowedDomains.some(d => 
        hostname === d.toLowerCase() || hostname.endsWith(`.${d.toLowerCase()}`)
      );
      if (!isDomainAllowed) {
        return { allowed: false, reason: `DOMAIN_NOT_IN_ALLOWLIST: ${hostname}` };
      }
    }

    // 6. Direct IP check
    if (net.isIP(hostname)) {
      if (this.isRestrictedIP(hostname)) {
        return { allowed: false, reason: `RESTRICTED_IP_DESTINATION: ${hostname}` };
      }
      return { allowed: true, resolvedIps: [hostname], sanitizedUrl: parsed.toString() };
    }

    // 7. DNS Resolution check (Inspect ALL resolved A and AAAA records)
    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        return { allowed: false, reason: 'DNS_RESOLUTION_EMPTY' };
      }

      const resolvedIps = records.map(r => r.address);
      for (const ip of resolvedIps) {
        if (this.isRestrictedIP(ip)) {
          return {
            allowed: false,
            reason: `DNS_RESOLVED_TO_RESTRICTED_IP: ${ip} for hostname ${hostname}`,
            resolvedIps
          };
        }
      }

      return { allowed: true, resolvedIps, sanitizedUrl: parsed.toString() };
    } catch (err: any) {
      return { allowed: false, reason: `DNS_RESOLUTION_FAILED: ${err.message}` };
    }
  }
}

/**
 * 🔒 Safe HTTP Client with Hop-by-Hop Redirect Validation & Resource Bounds
 */
export class SafeHttpClient {
  public static async fetch(
    url: string,
    options: RequestInit & EgressGuardOptions = {}
  ): Promise<Response> {
    const maxRedirects = options.maxRedirects ?? 3;
    const timeoutMs = options.timeoutMs ?? 6000;
    const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB

    let currentUrl = url;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      // 1. Validate destination URL on each hop
      const check = await EgressGuard.validateUrl(currentUrl, options);
      if (!check.allowed) {
        throw new Error(`[SafeHttpClient] Egress Guard Blocked: ${check.reason} (${currentUrl})`);
      }

      // 2. Execute fetch with manual redirect and abort timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(currentUrl, {
          ...options,
          redirect: 'manual',
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // 3. Handle Redirects Manually (re-validating next hop)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('[SafeHttpClient] Redirect status returned without Location header.');
        }

        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error(`[SafeHttpClient] Maximum redirect limit exceeded (${maxRedirects}).`);
        }
        continue;
      }

      // 4. Validate Content-Length if present
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
        throw new Error(`[SafeHttpClient] Response size ${contentLength} bytes exceeds limit ${maxSizeBytes}.`);
      }

      return response;
    }

    throw new Error('[SafeHttpClient] Unexpected loop termination in redirect chain.');
  }
}
