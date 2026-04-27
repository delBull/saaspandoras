import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;

// 🛡️ [Security & Reliability] Fallback for Staging/Dev environments 
// This prevents "build-time-placeholder" from breaking the app if env vars are missing during CI/CD or edge cases.
const STAGING_FALLBACK_KEY = "c8e595687d8cb3034821b18ed8268cbe";
const activeClientId = clientId || STAGING_FALLBACK_KEY;

if (!clientId && !secretKey && typeof window !== 'undefined') {
  console.warn(`⚠️ [Thirdweb] Using fallback Client ID (Ending in ...${STAGING_FALLBACK_KEY.slice(-4)}). Ensure NEXT_PUBLIC_THIRDWEB_CLIENT_ID is set in environment.`);
}

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: activeClientId }
);
