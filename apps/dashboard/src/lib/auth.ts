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
    address = headers.get('x-thirdweb-address') ??
      headers.get('x-wallet-address') ??
      headers.get('x-user-address');
  }

  if (!address) {
    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get('auth_token')?.value;

      if (authToken) {
        const decoded = jwt.decode(authToken) as JWTPayload | null;
        if (decoded?.address && validateWalletAddress(decoded.address)) {
          address = decoded.address;
        } else if (decoded?.sub && validateWalletAddress(decoded.sub)) {
          address = decoded.sub;
        }
      }

      if (!address) {
        const addrCookie = cookieStore.get('wallet-address')?.value ??
          cookieStore.get('thirdweb:wallet-address')?.value;
        if (validateWalletAddress(addrCookie)) {
          address = addrCookie ?? null;
        }
      }
    } catch (error) {
      // Silent in production
    }
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
