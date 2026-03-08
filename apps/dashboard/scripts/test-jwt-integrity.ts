import jwt from 'jsonwebtoken';
import { jose, importSPKI, jwtVerify } from 'jose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const JWT_PRIVATE_KEY_B64 = process.env.JWT_PRIVATE_KEY;
const JWT_PUBLIC_KEY_B64 = process.env.JWT_PUBLIC_KEY;

async function testJWT() {
    console.log("🔍 Testing JWT RS256 Integrity...");

    if (!JWT_PRIVATE_KEY_B64 || !JWT_PUBLIC_KEY_B64) {
        console.error("❌ Missing JWT keys in environment variables");
        process.exit(1);
    }

    try {
        const privateKeyPem = JWT_PRIVATE_KEY_B64.startsWith("-----")
            ? JWT_PRIVATE_KEY_B64
            : Buffer.from(JWT_PRIVATE_KEY_B64, "base64").toString("utf-8");

        const publicKeyPem = JWT_PUBLIC_KEY_B64.startsWith("-----")
            ? JWT_PUBLIC_KEY_B64
            : Buffer.from(JWT_PUBLIC_KEY_B64, "base64").toString("utf-8");

        const payload = {
            sub: "test-user-id",
            address: "0x123",
            scope: "web",
            v: 1,
            iat: Math.floor(Date.now() / 1000)
        };

        console.log("📦 Payload:", payload);

        // 1. Sign with jsonwebtoken (used in login/route.ts)
        const token = jwt.sign(payload, privateKeyPem, {
            algorithm: 'RS256',
            expiresIn: '1h'
        });

        console.log("✍️ Token signed successfully");

        // 2. Verify with jose (used in me/route.ts and middleware)
        const publicKey = await importSPKI(publicKeyPem, "RS256");
        const { payload: verifiedPayload } = await jwtVerify(token, publicKey, {
            algorithms: ["RS256"],
        });

        console.log("✅ Token verified successfully with jose!");
        console.log("🔑 Verified Payload:", verifiedPayload);

        if (verifiedPayload.sub === payload.sub && verifiedPayload.address === payload.address) {
            console.log("🌟 JWT INTEGRITY VERIFIED: Match!");
        } else {
            console.error("❌ JWT INTEGRITY FAILED: Payload mismatch");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ JWT Test failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

testJWT();
