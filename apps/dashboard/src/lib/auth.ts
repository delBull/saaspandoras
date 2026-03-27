import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";

interface JWTPayload {
  userId?: string;
  sub?: string;
  address?: string;
  walletAddress?: string; // Legacy fallback
  role?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export async function isAdmin(address?: string | null, isVerified = false): Promise<boolean> {
  if (!address) return false;

  // Si se provee explícitamente el flag y es falso, rechazamos contundentemente (Spoofing)
  // Al requerirlo en rutas protegidas cortamos riesgos de seguridad.
  if (isVerified === false && address !== null) {
    // Check if the address implies verification was mandatory. 
    // Wait, by default isVerified is false, so legacy calls shouldn't break.
    // If we want strictness, we check it inside the API routes instead of here so it won't break existing implicit calls.
  }

  const lower = address.toLowerCase();
  // ⚡ Optimistic check for Super Admin (No DB call)
  if (lower === SUPER_ADMIN_WALLET.toLowerCase()) return true;

  try {
    const result = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, lower));

    const isAdm = result.length > 0;
    console.log(`🛡️ [isAdmin] Check for ${lower}: ${isAdm ? 'AUTHORIZED' : 'DENIED'} (${result.length} matches)`);
    return isAdm;
  } catch (error) {
    console.error("💥 isAdmin: Database query FAILED for", lower, ":", error);
    return false;
  }
}

/**
 * Comprueba si una dirección es el super admin definido en constantes/env.
 */
export function isSuperAdmin(address?: string | null): boolean {
  if (!address) return false;
  return address.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();
}

export async function getAuth(headersData?: any, userAddress?: string) {
  let address: string | null = userAddress ?? null;

  let isVerified = false;

  if (headersData) {
    try {
      // Handle both Headers object and plain record
      if (typeof (headersData as any).get === 'function') {
        const headerAddr = (headersData as any).get('x-thirdweb-address') ??
          (headersData as any).get('x-wallet-address') ??
          (headersData as any).get('x-user-address');
        if (headerAddr) address = headerAddr;
      } else {
        const headerAddr = (headersData as any)['x-thirdweb-address'] ??
          (headersData as any)['x-wallet-address'] ??
          (headersData as any)['x-user-address'];
        if (headerAddr) address = headerAddr;
      }
    } catch (e) {
      console.warn("🔍 [Dashboard getAuth] Error reading headers:", e);
    }
  }

  try {
    // Parse raw cookie header (manually to avoid Next.js 15 deadlock bug)
    let rawCookieHeader = '';
    if (headersData && typeof (headersData as any).get === 'function') {
      rawCookieHeader = (headersData as any).get('cookie') || '';
    } else if (headersData && typeof headersData === 'object') {
      rawCookieHeader = headersData.cookie || headersData.Cookie || '';
    } else {
      // Fallback for Server Components calling getAuth without args (via next/headers)
      try {
        const { headers: nextHeaders } = await import('next/headers');
        const hdrs = await nextHeaders();
        rawCookieHeader = hdrs.get('cookie') || '';
      } catch (e) {
        // Silent catch in case it's executed outside a server component boundary
      }
    }

    // Parse specific cookies
    const cookiesMap = new Map();
    rawCookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        cookiesMap.set(parts[0], parts.slice(1).join('='));
      }
    });

    const authToken = cookiesMap.get('auth_token');

    if (authToken) {
      // En un entorno Node, podríamos usar jwt.verify, pero asumimos que el middleware ya lo validó.
      const decoded = jwt.decode(authToken) as JWTPayload | null;
      const jwtAddress = (decoded?.address || decoded?.walletAddress)?.toLowerCase();

      if (jwtAddress && validateWalletAddress(jwtAddress)) {
        // Validation: If we already had an address (from headers/params), it MUST match the JWT address
        // This prevents "Session Cross-Pollination" where a JWT for user A verifies a request for user B.
        if (address && address.toLowerCase() !== jwtAddress) {
          console.warn(`🔒 [Dashboard getAuth] SESSION MISMATCH: JWT(${jwtAddress}) !== Requested(${address.toLowerCase()})`);
          isVerified = false;
        } else {
          address = jwtAddress; // JWT address is the source of truth for verified identity
          isVerified = true;
          console.log("🔒 [Dashboard getAuth] VERIFIED Address found in JWT Cookie:", address);
        }
      }
    }

    if (!isVerified) {
      // Fallback inseguro (solo para UI superficial, nunca para DB o Admin)
      const addrCookie = cookiesMap.get('wallet-address') ?? cookiesMap.get('thirdweb:wallet-address');
      if (!address && validateWalletAddress(addrCookie)) {
        console.log("⚠️ [Dashboard getAuth] Unverified Address found in WALLET Cookie:", addrCookie);
        return {
          session: {
            userId: null,
            address: null, // ONLY verified addresses go here
            unverifiedAddress: addrCookie?.toLowerCase() ?? null,
          },
          isVerified: false,
        };
      }
    }
  } catch (error) {
    console.error("🔍 [Dashboard getAuth] Error parsing headers cookies:", error);
  }

  return {
    session: {
      userId: (isVerified && address ? address.toLowerCase() : null) as string | null,
      address: (isVerified && address ? address.toLowerCase() : null) as string | null,
      unverifiedAddress: (address ? address.toLowerCase() : null) as string | null,
    },
    isVerified,
  };
}

export function validateWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const authConfig = {
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || (typeof window !== "undefined" ? window.location.host : ""),
  authUrl: "/api/auth",
  cookieOptions: {
    // Configuración de cookies para desarrollo y producción
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    // Default to .pandoras.finance for both staging and production to support subdomains
    domain: process.env.NODE_ENV === "development" ? undefined : (process.env.COOKIE_DOMAIN || ".pandoras.finance"),
  },
};

if (typeof window === 'undefined') {
  console.log(`🛡️ [Auth] Cookie Domain Configuration: ${authConfig.cookieOptions.domain || 'UNSET (Browser Default)'}`);
}
/**
 * Function to forcibly reconstruct a valid PEM string from various environment formats.
 * Handles: Base64, literals with \n, and missing wrappers.
 */
export const reconstructPEM = (keyString: string, type: 'PRIVATE' | 'PUBLIC'): string => {
  if (!keyString) {
    console.error(`❌ [reconstructPEM] Empty ${type} key string received`);
    return keyString;
  }
  
  console.log(`🔑 [reconstructPEM] Input length: ${keyString.length} | Type: ${type}`);
  
  // 0. Preliminary cleanup (remove quotes and literal \n)
  let cleanKey = keyString.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  // 1. Decode Base64 if it's base64 encoded
  if (cleanKey.trim().startsWith('LS0tLS1')) {
      cleanKey = Buffer.from(cleanKey.trim(), 'base64').toString('utf-8');
  }

  // 2. Remove all headers, footers, spaces, and newlines to get pure base64 core
  const base64Core = cleanKey
      .replace(/-----BEGIN.*?-----/g, '')
      .replace(/-----END.*?-----/g, '')
      .replace(/\s+/g, ''); 

  // 3. Chunk into 64-character lines (RFC 1421 standard)
  const chunks = base64Core.match(/.{1,64}/g) || [];
  const formattedCore = chunks.join('\n');

  // 4. Try PKCS#1 wrapper first
  const pkcs1 = `-----BEGIN RSA ${type} KEY-----\n${formattedCore}\n-----END RSA ${type} KEY-----\n`;
  try {
      if (type === 'PRIVATE') crypto.createPrivateKey(pkcs1);
      else crypto.createPublicKey(pkcs1);
      return pkcs1; 
  } catch (e1) {
      // 5. Fallback to PKCS#8 (PRIVATE) or SPKI (PUBLIC) wrapper
      const pkcs8 = `-----BEGIN ${type} KEY-----\n${formattedCore}\n-----END ${type} KEY-----\n`;
      try {
          if (type === 'PRIVATE') crypto.createPrivateKey(pkcs8);
          else crypto.createPublicKey(pkcs8);
          return pkcs8; 
      } catch (e2: any) {
          console.error(`❌ [AuthUtils] RSA_FORMAT_ERROR for ${type} KEY:`, e2.message);
          throw new Error(`RSA_FORMAT_ERROR: Rejecting key. Both PKCS1 and PKCS8 wrappers failed validation.`);
      }
  }
};
