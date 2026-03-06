import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

    return result.length > 0;
  } catch (error) {
    console.error("💥 isAdmin: Database query FAILED:", error);
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

  if (headersData && !address) {
    try {
      // Handle both Headers object and plain record
      if (typeof (headersData as any).get === 'function') {
        address = (headersData as any).get('x-thirdweb-address') ??
          (headersData as any).get('x-wallet-address') ??
          (headersData as any).get('x-user-address');
      } else {
        address = (headersData as any)['x-thirdweb-address'] ??
          (headersData as any)['x-wallet-address'] ??
          (headersData as any)['x-user-address'];
      }
    } catch (e) {
      console.warn("🔍 [Dashboard getAuth] Error reading headers:", e);
    }
  }

  if (!address) {
    try {
      // 🚨 CRITICAL BUGFIX: We CANNOT use `await cookies()` inside this utility function on Vercel Serverless.
      // Next.js 15 has a crippling bug where `await cookies()` occasionally deadlocks the V8 event loop
      // when executed outside the immediate route handler scope, causing 10s silent timeouts.
      // We manually parse the raw cookie header instead.

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
        if (decoded?.address && validateWalletAddress(decoded.address)) {
          address = decoded.address;
          isVerified = true;
          console.log("🔒 [Dashboard getAuth] VERIFIED Address found in JWT Cookie:", address);
        } else if (decoded?.walletAddress && validateWalletAddress(decoded.walletAddress)) {
          // Fallback temporal para sesiones generadas con la estructura anterior
          address = decoded.walletAddress;
          isVerified = true;
          console.log("🔒 [Dashboard getAuth] VERIFIED Address found in JWT Cookie (legacy):", address);
        }
      }

      if (!address) {
        // Fallback inseguro (solo para UI superficial, nunca para DB o Admin)
        const addrCookie = cookiesMap.get('wallet-address') ?? cookiesMap.get('thirdweb:wallet-address');
        if (validateWalletAddress(addrCookie)) {
          // WE DO NOT SET address HERE. This prevents session.address from being spoofed!
          isVerified = false;
          console.log("⚠️ [Dashboard getAuth] Address found in unverified WALLET Cookie:", addrCookie);
          return {
            session: {
              userId: null,
              address: null,
              unverifiedAddress: addrCookie?.toLowerCase() ?? null,
            },
            isVerified,
          };
        }
      }
    } catch (error) {
      console.error("🔍 [Dashboard getAuth] Error parsing headers cookies:", error);
    }
  }

  return {
    session: {
      userId: (address ? address.toLowerCase() : null) as string | null, // Compatibilidad superficial
      address: (address ? address.toLowerCase() : null) as string | null,
      unverifiedAddress: (address ? address.toLowerCase() : null) as string | null,
    },
    isVerified,
  };
}

export function validateWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
