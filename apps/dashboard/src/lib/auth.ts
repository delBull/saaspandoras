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

/**
 * Comprueba si una dirección es admin o super admin.
 */
export async function isAdmin(address?: string | null): Promise<boolean> {
  if (!address) return false;

  const lower = address.toLowerCase();
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

/**
 * Obtiene la sesión autenticada del usuario.
 */
export async function getAuth(headers?: any, userAddress?: string) {
  let address: string | null = userAddress ?? null;

  if (headers && !address) {
    try {
      address = headers.get('x-thirdweb-address') ??
        headers.get('x-wallet-address') ??
        headers.get('x-user-address');

      if (address) console.log("🔍 [Dashboard getAuth] Address found in HEADERS:", address);
    } catch (e) {
      console.warn("🔍 [Dashboard getAuth] Could not read headers, likely not a Headers object");
    }
  }

  if (!address) {
    try {
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
