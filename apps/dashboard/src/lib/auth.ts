import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sanitizeLogData } from "./security-utils";

interface JWTPayload {
  userId?: string;
  sub?: string;
  username?: string;
  avatar?: string;
  ownerId?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

/**
 * Comprueba si una dirección es admin o super admin.
 */
export async function isAdmin(address?: string | null): Promise<boolean> {
  const isSuper = isSuperAdmin(address);
  if (isSuper) return true;

  if (!address) return false;
  const lower = address.toLowerCase();

  try {
    // 📍 Step 2: Database check for regular admin
    const result = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, lower));

    const isAdmin = result.length > 0;

    // Only log in development and only for important cases
    if (process.env.NODE_ENV === 'development' && isAdmin) {
      console.log("✅ isAdmin: Regular admin confirmed");
    }

    return isAdmin;
  } catch (error) {
    console.error("💥 isAdmin: Database query FAILED:", error);
    // If database query fails, already checked super admin at the top
    return false;
  }
}

/**
 * Comprueba si una dirección es el super admin definido en constantes/env.
 */
export function isSuperAdmin(address?: string | null): boolean {
  if (!address) return false;
  const lower = address.toLowerCase();
  const isSuper = lower === SUPER_ADMIN_WALLET.toLowerCase();

  if (isSuper && process.env.NODE_ENV === 'development') {
    console.log("🎉 isSuperAdmin: ✅ SUPER ADMIN CONFIRMED");
  }

  return isSuper;
}

interface MinimalHeaders {
  get(name: string): string | null;
  has(name: string): boolean;
  entries(): IterableIterator<[string, string]>;
}

/**
 * Obtiene la sesión autenticada del usuario en Thirdweb v5.
 * En producción, lee desde headers primero, luego cookies.
 */
export async function getAuth(headers?: MinimalHeaders, userAddress?: string) {
  let address: string | null = userAddress ?? null;

  // Primero intentar desde headers (para server-side auth)
  if (headers) {
    try {
      // Basic headers access - compatible with both Node.js and Edge runtime
      // Try multiple header names in case Vercel filters some
      const headerAddress = headers.get('x-thirdweb-address') ??
        headers.get('x-wallet-address') ??
        headers.get('x-user-address') ??
        headers.get('x-address');
      if (headerAddress) {
        address = headerAddress;
        console.log('✅ [Auth] Found address in headers:', address.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('Error accessing headers:', error);
      // Continue to cookie fallback
    }
  }

  // Si no se encontro en headers, intentar cookies
  if (!address) {
    try {
      // Intentar obtener desde cookies - this works in both runtimes
      const cookieStore = await cookies();

      // 1. Priority: Check for 'auth_token' (Set by API Core)
      const authToken = cookieStore.get('auth_token')?.value;
      if (authToken) {
        try {
          const decoded = jwt.decode(authToken) as JWTPayload | null;
          if (decoded?.sub) {
            address = decoded.sub;
            console.log('✅ [Auth] Found legitimate auth_token:', address.substring(0, 10) + '...');
          }
        } catch (e) {
          console.error('❌ [Auth] Failed to decode auth_token:', e);
        }
      }

      // 2. Fallback: Standard Thirdweb cookies
      if (!address) {
        // First try the simple wallet-address cookie
        address = cookieStore.get('wallet-address')?.value ?? null;
      }

      // If not found, try ThirdWeb specific cookies
      if (!address) {
        address = cookieStore.get('thirdweb:wallet-address')?.value ?? null;
      }

      // If not found, try other possible cookie names
      if (!address) {
        const allCookies = cookieStore.getAll();
        const walletCookie = allCookies.find(cookie =>
          cookie.name.includes('wallet') &&
          cookie.name.includes('address') &&
          cookie.value &&
          cookie.value.startsWith('0x') &&
          cookie.value.length === 42
        );
        if (walletCookie) {
          address = walletCookie.value;
        }
      }

      // If not found, try to decode the JWT token (Vercel / Old)
      if (!address) {
        const jwtToken = cookieStore.get('_vercel_jwt')?.value;
        if (jwtToken) {
          try {
            console.log('🔍 [Auth] Attempting to decode Vercel JWT token');
            const decoded = jwt.decode(jwtToken) as JWTPayload | null;
            if (decoded) {
              // The userId in the JWT is NOT the wallet address - it's an internal Thirdweb identifier
              // We need to find the actual wallet address associated with this user
              // For now, return null and let the application handle this case
              // console.log('❌ [Auth] JWT userId is not a wallet address:', decoded.userId);
              address = null;
            }
          } catch (jwtError) {
            console.error('❌ [Auth] Error decoding Vercel JWT:', jwtError);
          }
        }
      }

      if (address) {
        console.log('✅ [Auth] Final Address Resolved:', address.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('Error accessing cookies:', error);
    }
  }

  // Log final result for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 [Auth] Final session result:', {
      hasAddress: !!address,
      address: address ? address.substring(0, 10) + '...' : null,
      userId: address ? address.toLowerCase().substring(0, 10) + '...' : null
    });
  }

  return {
    session: {
      userId: address ? address.toLowerCase() : null,
      address: address ? address.toLowerCase() : null,
    },
  };
}

/**
 * Función helper para validar direcciones de wallet desde el cliente
 * Esta debe ser llamada desde componentes del cliente
 */
export function validateWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;

  // Validar que sea una dirección Ethereum válida
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
