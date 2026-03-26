import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;

if (!clientId && !secretKey && typeof window !== 'undefined') {
  console.warn("⚠️ [Thirdweb] No Client ID found. Wallet connections WILL fail. Ensure NEXT_PUBLIC_THIRDWEB_CLIENT_ID is set in .env.local");
}

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: clientId || "build-time-placeholder" }
);
