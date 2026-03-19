import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getContract, readContract } from "thirdweb";
import crypto from "crypto";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "No session token" }, { status: 401 });
        }

        // Function to forcibly reconstruct a valid PEM string
        const reconstructPEM = (keyString: string, type: 'PRIVATE' | 'PUBLIC'): string => {
            if (!keyString) return keyString;
            
            // 1. Remove obvious invalid wrapping quotes if they exist
            let cleanKey = keyString.replace(/^["']|["']$/g, '');

            // 2. Decode Base64 if it's base64 encoded (starts with LS0)
            if (cleanKey.startsWith('LS0tLS1')) {
                cleanKey = Buffer.from(cleanKey, 'base64').toString('utf-8');
            }

            // 3. Remove all headers, footers, spaces, and newlines to get pure base64 core
            const base64Core = cleanKey
                .replace(/-----BEGIN.*?-----/g, '')
                .replace(/-----END.*?-----/g, '')
                .replace(/\\n/g, '')
                .replace(/\s+/g, '');

            // 4. Chunk into 64-character lines (RFC 1421 standard)
            const chunks = base64Core.match(/.{1,64}/g) || [];
            const formattedCore = chunks.join('\n');

            // 5. Try PKCS#1 wrapper first
            const pkcs1 = `-----BEGIN RSA ${type} KEY-----\n${formattedCore}\n-----END RSA ${type} KEY-----\n`;
            try {
                if (type === 'PRIVATE') crypto.createPrivateKey(pkcs1);
                else crypto.createPublicKey(pkcs1);
                return pkcs1; 
            } catch (e1) {
                // 6. Fallback to PKCS#8 (PRIVATE) or SPKI (PUBLIC) wrapper
                const pkcs8 = `-----BEGIN ${type} KEY-----\n${formattedCore}\n-----END ${type} KEY-----\n`;
                try {
                    if (type === 'PRIVATE') crypto.createPrivateKey(pkcs8);
                    else crypto.createPublicKey(pkcs8);
                    return pkcs8; 
                } catch (e2: any) {
                    throw new Error(`RSA_FORMAT_ERROR: Rejecting key. Both PKCS1 and PKCS8 wrappers failed validation.`);
                }
            }
        };

        const hasPublicKey = !!process.env.JWT_PUBLIC_KEY;
        const decodedToken = jwt.decode(token, { complete: true }) as any;
        const tokenAlg = decodedToken?.header?.alg || (hasPublicKey ? 'RS256' : 'HS256');
        
        // 🔑 Key Preparation: Separate verification (public/secret) and signing (private/secret)
        const verificationKey = tokenAlg === 'RS256' && process.env.JWT_PUBLIC_KEY 
            ? reconstructPEM(process.env.JWT_PUBLIC_KEY, 'PUBLIC') 
            : (process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || "");

        const signingKey = hasPublicKey && process.env.JWT_PRIVATE_KEY
            ? reconstructPEM(process.env.JWT_PRIVATE_KEY, 'PRIVATE')
            : (process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || "");

        let payload: any;
        try {
            payload = jwt.verify(token, verificationKey, {
                algorithms: [tokenAlg as any]
            });
        } catch (e: any) {
            console.warn(`⚠️ [API Refresh] JWT Verification failed with ${tokenAlg}:`, e.message);
            return NextResponse.json({ error: "Invalid token", details: e.message }, { status: 401 });
        }

        const userId = payload.sub;
        const address = payload.address || payload.sub; // Fallback if old token format
        
        if (!userId || !address) return NextResponse.json({ error: "Invalid token structure" }, { status: 401 });

        console.log(`🔄 [API Refresh] Re-verifying access for ${address} (NFT: ${config.nftContractAddress})`);

        // Check Blockchain
        const contract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress as string,
            abi: PANDORAS_KEY_ABI
        });

        let hasAccess = false;
        try {
            hasAccess = await readContract({
                contract,
                method: "isGateHolder",
                params: [address]
            });
        } catch (e) {
            console.error("Gate check error in refresh:", e);
            hasAccess = false;
        }
        
        console.log(`🔄 [API Refresh] Updating DB for ${address} (Access: ${hasAccess})`);
        // Update DB
        const walletAddressLower = typeof address === 'string' ? address.toLowerCase() : String(address).toLowerCase();
        
        // 🧪 Diagnostic: We use the key names from the schema, Drizzle handles the mapping to snake_case literals
        await db.update(users)
            .set({ hasPandorasKey: hasAccess })
            .where(eq(users.walletAddress, walletAddressLower));

        console.log(`🔄 [API Refresh] Step 5 - Re-issuing session token`);
        // Re-issue Token - Strip reserved claims to avoid collision with sign options
        const { exp, iat, nbf, iss, sub, ...cleanPayload } = payload;
        
        const newToken = jwt.sign({
            ...cleanPayload,
            sub: userId, 
            address: address, 
            hasAccess: hasAccess, // DYNAMIC! Re-verify with on-chain check
            iat: Math.floor(Date.now() / 1000)
        }, signingKey, { 
            expiresIn: '24h',
            algorithm: hasPublicKey ? 'RS256' : 'HS256'
        });

        const isProd = process.env.NODE_ENV === "production";
        const cookieDomain = isProd ? (process.env.COOKIE_DOMAIN || ".pandoras.finance") : undefined;

        const cookieStoreObj = await cookies();
        cookieStoreObj.set("auth_token", newToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            ...(cookieDomain && { domain: cookieDomain }),
            path: "/",
            maxAge: 60 * 60 * 24 
        });

        console.log(`✅ [API Refresh] Session refreshed for ${address}. Access Granted.`);

        return NextResponse.json({
            authenticated: true,
            hasAccess: hasAccess,
            user: {
                id: userId,
                address: address,
                role: payload.role || "user",
                scope: payload.scope,
                hasAccess: hasAccess,
            }
        });

    } catch (error: any) {
        console.error("🔥 [API Refresh] CRITICAL ERROR:");
        console.error("Message:", error.message);
        console.error("Path:", request.url);
        if (error.stack) console.error("Stack:", error.stack);
        
        // 🧪 Diagnostic: Log the error details to the response for the user to see in dev/staging
        const isProd = process.env.NODE_ENV === "production";
        const isStaging = typeof window !== 'undefined' && window.location.hostname.includes("staging");
        
        return NextResponse.json({ 
            error: "Internal Error", 
            details: error.message,
            ...( (!isProd || isStaging) && { 
                stack: error.stack,
                hint: "Check if 'wallet_address' and 'has_pandoras_key' naming matches accurately in src/db/schema.ts" 
            })
        }, { status: 500 });
    }
}
