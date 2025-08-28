import { createThirdwebClient } from "thirdweb";

// You can get a client id from https://thirdweb.com/dashboard
const clientId = "8a0dde1c971805259575cea5cb737530";

if (!clientId) {
  throw new Error("Missing THIRDWEB_CLIENT_ID environment variable");
}

export const client = createThirdwebClient({
  clientId: clientId,
});
