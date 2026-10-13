import dns from 'dns/promises';
import net from 'net';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  resolvedIp?: string;
}

/**
 * Checks if an IPv4 or IPv6 string is within private, loopback, link-local,
 * or cloud metadata IP ranges.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  // Check IPv4
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    const [b0, b1, b2, b3] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;

    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;

    // 10.0.0.0/8 (Private RFC 1918)
    if (b0 === 10) return true;

    // 172.16.0.0/12 (Private RFC 1918)
    if (b0 === 172 && b1 !== undefined && b1 >= 16 && b1 <= 31) return true;

    // 192.168.0.0/16 (Private RFC 1918)
    if (b0 === 192 && b1 === 168) return true;

    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata)
    if (b0 === 169 && b1 === 254) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 !== undefined && b1 >= 64 && b1 <= 127) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (b0 === 192 && b1 === 0 && b2 === 0) return true;

    // 198.18.0.0/15 (Benchmarking)
    if (b0 === 198 && b1 !== undefined && (b1 === 18 || b1 === 19)) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (b0 !== undefined && b0 >= 224) return true;

    // Broadcast
    if (ip === '255.255.255.255') return true;

    return false;
  }

  // Check IPv6
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();

    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

    // :: (Unspecified)
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

    // fe80::/10 (Link-local)
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
      return true;
    }

    // fc00::/7 (Unique local address)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }

    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (normalized.includes('::ffff:')) {
      const ipv4Part = normalized.split('::ffff:')[1];
      if (ipv4Part && net.isIPv4(ipv4Part)) {
        return isPrivateOrRestrictedIp(ipv4Part);
      }
    }

    return false;
  }

  return true; // Unknown IP structure treated as restricted
}

/**
 * Validates a webhook destination URL against SSRF attacks.
 * Resolves DNS to check real destination IP and enforces HTTPS in production.
 */
export async function validateWebhookDestinationUrl(
  rawUrl: string,
  options: { isProduction?: boolean; allowLocalhostInDev?: boolean } = {}
): Promise<UrlValidationResult> {
  const isProd = options.isProduction ?? process.env.NODE_ENV === 'production';
  const allowDevLocal = options.allowLocalhostInDev ?? !isProd;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { isValid: false, error: 'Malformed or invalid URL syntax' };
  }

  // 1. Protocol validation
  if (isProd && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Protocol '${parsed.protocol}' is prohibited. Only 'https:' is permitted in production environments.`
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      isValid: false,
      error: `Invalid protocol '${parsed.protocol}'. Only HTTP/HTTPS are supported.`
    };
  }

  // 2. Port validation
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const allowedPorts = isProd ? [443, 8443] : [80, 443, 3000, 3001, 8000, 8080, 8443];
    if (!allowedPorts.includes(portNum)) {
      return {
        isValid: false,
        error: `Port ${portNum} is not allowed for webhook delivery.`
      };
    }
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Fast-check: Development localhost exemption
  if (!isProd && allowDevLocal && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return { isValid: true, resolvedIp: '127.0.0.1' };
  }

  // 4. DNS resolution to catch DNS rebinding or direct IP destinations
  try {
    const addresses = await dns.lookup(hostname, { all: true });

    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: `Could not resolve hostname: ${hostname}` };
    }

    for (const record of addresses) {
      if (isPrivateOrRestrictedIp(record.address)) {
        return {
          isValid: false,
          error: `Access to private or restricted network address (${record.address}) is blocked.`,
          resolvedIp: record.address
        };
      }
    }

    return { isValid: true, resolvedIp: addresses[0]?.address };
  } catch (err: any) {
    return {
      isValid: false,
      error: `DNS resolution failed for hostname '${hostname}': ${err.message || 'unknown error'}`
    };
  }
}
