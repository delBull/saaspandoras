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
  role?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export async function isAdmin(address?: string | null): Promise<boolean> {
  if (!address) return false;

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

      if (address) console.log("🔍 [Dashboard getAuth] Address found in HEADERS:", address);
    } catch (e) {
      console.warn("🔍 [Dashboard getAuth] Error reading headers:", e);
    }
  }

  if (!address) {
    try {
      // Use Next.js 15 async cookies/headers if possible
      const cookieStore = await cookies();
      const authToken = cookieStore.get('auth_token')?.value;

      if (authToken) {
        const decoded = jwt.decode(authToken) as JWTPayload | null;
        if (decoded?.address && validateWalletAddress(decoded.address)) {
          address = decoded.address;
          console.log("🔍 [Dashboard getAuth] Address found in JWT Cookie:", address);
        } else if (decoded?.sub && validateWalletAddress(decoded.sub)) {
          address = decoded.sub;
          console.log("🔍 [Dashboard getAuth] Address found in JWT Cookie (sub):", address);
        }
      }

      if (!address) {
        const addrCookie = cookieStore.get('wallet-address')?.value ??
          cookieStore.get('thirdweb:wallet-address')?.value;
        if (validateWalletAddress(addrCookie)) {
          address = addrCookie ?? null;
          console.log("🔍 [Dashboard getAuth] Address found in WALLET Cookie:", address);
        }
      }
    } catch (error) {
      console.error("🔍 [Dashboard getAuth] Error reading cookies:", error);
    }
  }

  if (!address) {
    console.warn("🔍 [Dashboard getAuth] NO ADDRESS FOUND after all checks");
  }

  return {
    session: {
      userId: (address ? address.toLowerCase() : null) as string | null,
      address: (address ? address.toLowerCase() : null) as string | null,
    },
  };
}

export function validateWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
