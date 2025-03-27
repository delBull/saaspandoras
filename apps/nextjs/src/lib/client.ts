// lib/client.ts
import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const secretKey = process.env.THIRDWEB_SECRET_KEY;

if (!clientId && !secretKey) {
  throw new Error("NEXT_PUBLIC_THIRDWEB_CLIENT_ID o THIRDWEB_SECRET_KEY deben estar definidos en .env.local.");
}

export const client = secretKey
  ? createThirdwebClient({ secretKey })
  : createThirdwebClient({ clientId: clientId! }); 
