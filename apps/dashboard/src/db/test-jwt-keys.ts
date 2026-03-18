import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function processKey(key: string | undefined, name: string): string | undefined {
    if (!key) {
        console.error(`❌ ${name} is UNDEFINED`);
        return undefined;
    }

    let processedKey = key;
    if (processedKey.startsWith('LS0tLS1')) {
        console.log(`📡 Detected Base64 ${name}. Decoding...`);
        processedKey = Buffer.from(processedKey, 'base64').toString('utf-8');
    }

    processedKey = processedKey.replace(/\\n/g, '\n');
    
    if (processedKey.includes('-----BEGIN')) {
        console.log(`✅ ${name} looks like a valid PEM key.`);
    } else {
        console.log(`⚠️ ${name} does not look like a PEM key (might be a secret string).`);
    }

    return processedKey;
}

function test() {
    console.log("🚀 Starting JWT Key Diagnostic...");

    const pri = processKey(process.env.JWT_PRIVATE_KEY, 'JWT_PRIVATE_KEY');
    const pub = processKey(process.env.JWT_PUBLIC_KEY, 'JWT_PUBLIC_KEY');

    if (!pri || !pub) {
        console.error("❌ Cannot proceed without both keys.");
        process.exit(1);
    }

    const payload = { sub: 'test-user', sid: 'test-session', address: '0x123' };
    const alg = pri.includes('-----BEGIN') ? 'RS256' : 'HS256';

    console.log(`🧪 Attempting to SIGN with ${alg}...`);
    try {
        const token = jwt.sign(payload, pri, { algorithm: alg as jwt.Algorithm, expiresIn: '1h' });
        console.log("✅ Token signed successfully.");

        console.log(`🧪 Attempting to VERIFY with ${alg}...`);
        const decoded = jwt.verify(token, pub, { algorithms: [alg as jwt.Algorithm] });
        console.log("✅ Token verified successfully!");
        console.log("📦 Decoded Payload:", decoded);
        
        console.log("\n🎉 ALL JWT TESTS PASSED!");
    } catch (e: any) {
        console.error("💥 JWT TEST FAILED:", e.message);
    }
}

test();
