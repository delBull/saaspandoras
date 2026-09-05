import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY || process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn("⚠️ No Thirdweb Client ID found. Thirdweb features will not work.");
}

export const client = createThirdwebClient({
  clientId: clientId as string,
});
