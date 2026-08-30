import { db } from "~/db";
import { administrators, users } from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { unstable_cache } from "next/cache";

interface JWTPayload {
  userId?: string;
  sub?: string;
  address?: string;
  walletAddress?: string; // Legacy fallback
  alg?: "RS256" | "HS256";
  role?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export async function isAdmin(address?: string | null): Promise<boolean> {
  if (!address || address === "0x_undefined_admin") return false;
  const lower = address.toLowerCase();
  
  // 🛡️ SECURITY GUARD: Strictly enforce Ethereum Address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(lower)) {
    console.error("🚨 [Auth] RBAC REJECTION: isAdmin requires a valid 0x wallet address. Received:", lower);
    return false; 
  }

  // ⚡ ADMIN BYPASS: Marco's Admin Wallet (from env var)
  const MARCO_ADMIN = (process.env.MARCO_ADMIN_WALLET || "").toLowerCase();
  if (MARCO_ADMIN && lower === MARCO_ADMIN) return true;

  // ⚡ Optimistic check for Super Admin (No DB call)
  const superAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || process.env.SUPER_ADMIN_WALLET || "0x_undefined_admin").toLowerCase();
  if (lower === superAdmin && superAdmin !== "0x_undefined_admin") return true;

  try {
    const getCachedAdmin = unstable_cache(
      async (wallet: string) => {
        // 1. Check administrators table (case-insensitive)
        const adminResult = await db
          .select({ id: administrators.id })
          .from(administrators)
          .where(sql`lower(${administrators.walletAddress}) = ${wallet}`)
          .limit(1);
        if (adminResult.length > 0) return true;

        // 2. Check users table for admin/superadmin/operator role (case-insensitive)
        const userResult = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(sql`lower(${users.walletAddress}) = ${wallet}`)
          .limit(1);
        if (userResult.length > 0) {
          const r = (userResult[0]?.role || '').toLowerCase();
          if (r === 'admin' || r === 'superadmin' || r === 'operator') return true;
        }

        return false;
      },
      [`admin-check-${lower}`],
      { revalidate: 60 } // Cache for 1 minute
    );

    return await getCachedAdmin(lower);
  } catch (error) {
    console.error("💥 isAdmin: Database query FAILED for", lower, ":", error);
    return false;
  }
}

export function isSuperAdmin(address?: string | null): boolean {
  if (!address) return false;
  return address.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();
}

/**
 * CORE AUTHORIZATION RESOLVER
 * 🛡️ Unified pattern to extract verified identity from encrypted cookies.
 */
export async function getAuth(headersData?: any, userAddress?: string) {
  let address: string | null = userAddress ?? null;
  let isVerified = false;

  try {
    // 1. Get Raw Cookies (Compatibility Layer)
    let rawCookieHeader = '';
    if (headersData) {
      if (headersData.headers && typeof headersData.headers.get === 'function') {
        rawCookieHeader = headersData.headers.get('cookie') || '';
      } else if (typeof (headersData as any).get === 'function') {
        rawCookieHeader = (headersData as any).get('cookie') || '';
      } else {
        rawCookieHeader = (headersData as any).cookie || (headersData as any).Cookie || '';
      }
    } else {
      try {
        const hdrs = await nextHeaders();
        rawCookieHeader = hdrs.get('cookie') || '';
      } catch (e) { /* Silent catch */ }
    }

    // 2. Parse Cookies
    const cookiesMap = new Map();
    rawCookieHeader.split(';').forEach((cookie: string) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name) cookiesMap.set(name, rest.join('='));
    });

    // 3. Extract Token (Priority: __pbox_sid)
    const authToken = cookiesMap.get('__pbox_sid') || 
                     cookiesMap.get('auth_token') || 
                     cookiesMap.get('pbox_session_v3');

    const decodeStartTime = Date.now();
    if (authToken) {
      const decoded = await verifyJWT(authToken);
      console.log(`🕵️ [Auth] verifyJWT resolved in ${Date.now() - decodeStartTime}ms`);
      
      if (decoded) {
          // 🔥 INSTITUTIONAL FIX: Any valid JWT is a valid session.
          // Extract address if available, but don't fail if it's missing.
          const finalAddr = (decoded.address || (decoded as any).walletAddress)?.toLowerCase() || null;
          
          return {
              session: {
                  userId: null, // 🛡️ ELITE FIX: Kill UUID identity to prevent RBAC "crossover" bugs
                  address: finalAddr,
                  unverifiedAddress: null,
              },
              isVerified: true,
          };
      }
    }

    // 4. Unverified Fallback (For UI only)
    if (!isVerified && !address) {
       const addrCookie = cookiesMap.get('wallet-address') ?? cookiesMap.get('thirdweb:wallet-address');
       if (addrCookie && /^0x[a-fA-F0-9]{40}$/.test(addrCookie)) {
           return {
               session: { userId: null, address: null, unverifiedAddress: addrCookie.toLowerCase() },
               isVerified: false
           };
       }
    }
  } catch (error) {
    console.error("🔍 [Dashboard getAuth] Error:", error);
  }

  return {
    session: {
      userId: null,
      address: null,
      unverifiedAddress: address?.toLowerCase() ?? null,
    },
    isVerified: false,
  };
}

/**
 * RECONSTRUCT PEM UTILITY (Symmetrical Logic)
 * 🔬 Handles: Base64, literals with \n, and Vercel-escaped newlines.
 */
export const reconstructPEM = (keyString: string, type: 'PRIVATE' | 'PUBLIC'): string => {
  if (!keyString) return "";
  
  // 1. Cleanup: Handle Vercel escaped \n and raw literal quotes
  let cleanKey = keyString.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');

  // 2. Decode Base64 block if present
  if (cleanKey.trim().startsWith('LS0tLS1')) {
      cleanKey = Buffer.from(cleanKey.trim(), 'base64').toString('utf-8');
  }

  // 3. Extract Core Base64
  const base64Core = cleanKey
      .replace(/-----BEGIN.*?-----/g, '')
      .replace(/-----END.*?-----/g, '')
      .replace(/\s+/g, ''); 

  // 4. RFC 1421 Formatting
  const chunks = base64Core.match(/.{1,64}/g) || [];
  const formattedCore = chunks.join('\n');

  // 5. Tiered Wrapping
  const pkcs8 = `-----BEGIN ${type} KEY-----\n${formattedCore}\n-----END ${type} KEY-----\n`;
  try {
      if (type === 'PRIVATE') crypto.createPrivateKey(pkcs8);
      else crypto.createPublicKey(pkcs8);
      return pkcs8; 
  } catch (err8: any) {
      const pkcs1 = `-----BEGIN RSA ${type} KEY-----\n${formattedCore}\n-----END RSA ${type} KEY-----\n`;
      try {
          if (type === 'PRIVATE') crypto.createPrivateKey(pkcs1);
          else crypto.createPublicKey(pkcs1);
          return pkcs1; 
      } catch (err1: any) {
          // ELITE FIX: Bypass PEM completely and use raw DER buffer if PEM wrapping fails
          try {
              const rawDer = Buffer.from(base64Core, 'base64');
              if (type === 'PRIVATE') {
                  const keyObj = crypto.createPrivateKey({ key: rawDer, format: 'der', type: 'pkcs8' });
                  return keyObj.export({ type: 'pkcs8', format: 'pem' }).toString();
              } else {
                  const keyObj = crypto.createPublicKey({ key: rawDer, format: 'der', type: 'spki' });
                  return keyObj.export({ type: 'spki', format: 'pem' }).toString();
              }
          } catch (derErr: any) {
              console.error(`❌ [AuthUtils] FATAL: RSA format rejected for ${type}. Error: ${derErr.message}. Core: ${base64Core.substring(0,10)}...`);
              return keyString;
          }
      }
  }
};

/**
 * ELITE VERIFICATION ENGINE (Tiered Fallback)
 * 🛡️ Ensures local development and production keys never break verification.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const publicKeyRaw = process.env.JWT_PUBLIC_KEY;
  const privateKeyRaw = process.env.JWT_PRIVATE_KEY;
  const secretRaw = process.env.JWT_SECRET;

  try {
      // 🕵️ DETERMINISTIC ENGINE: Extract Algorithm from Header
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error("INVALID_TOKEN_STRUCTURE");
      
      const header = JSON.parse(Buffer.from(parts[0] as string, 'base64').toString());
      const alg = header.alg as string;

      if (alg === 'RS256') {
          // Attempt RS256 Stage 1: Public Key
          if (publicKeyRaw) {
              try {
                  const pem = reconstructPEM(publicKeyRaw, 'PUBLIC');
                  const key = crypto.createPublicKey(pem);
                  return jwt.verify(token, key, { algorithms: ['RS256'] }) as JWTPayload;
              } catch (e: any) { /* proceed to private derive */ }
          }
          // Attempt RS256 Stage 2: Private Key Derive
          if (privateKeyRaw) {
              try {
                  const pem = reconstructPEM(privateKeyRaw, 'PRIVATE');
                  const key = crypto.createPublicKey(pem);
                  return jwt.verify(token, key, { algorithms: ['RS256'] }) as JWTPayload;
              } catch (e: any) {
                  console.error("❌ [Auth] RS256 Verification Failed:", e.message);
              }
          }
      } else if (alg === 'HS256') {
          // Attempt HS256 Stage: Secret
          if (secretRaw) {
              try {
                  return jwt.verify(token, secretRaw, { algorithms: ['HS256'] }) as JWTPayload;
              } catch (e: any) {
                  console.error("❌ [Auth] HS256 Verification Failed:", e.message);
              }
          } else {
            console.error("❌ [Auth] JWT uses HS256 but JWT_SECRET is missing.");
          }
      } else {
          console.error(`❌ [Auth] UNKNOWN ALGORITHM: ${alg}`);
      }

  } catch (err: any) {
      console.error("❌ [Auth] Determinstic Verification Trace Failed:", err.message);
  }

  return null;
}

/**
 * Require a verified JWT session with optional admin check.
 * Returns the authenticated address or throws a 401/403 error response.
 * Use this in route handlers instead of reading x-wallet-address headers.
 */
export async function requireVerifiedAuth(requireAdmin = false): Promise<{ address: string; session: any }> {
  const auth = await getAuth();

  if (!auth.isVerified || !auth.session?.address) {
    throw new AuthError("No autorizado. Debes iniciar sesión con tu wallet.", 401);
  }

  if (requireAdmin) {
    const admin = await isAdmin(auth.session.address);
    if (!admin) {
      throw new AuthError("No autorizado. Se requieren permisos de administrador.", 403);
    }
  }

  return { address: auth.session.address, session: auth.session };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export const authConfig = {
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 
  },
};
