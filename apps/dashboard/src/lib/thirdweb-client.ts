import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!secretKey && !clientId) {
  throw new Error("Missing Thirdweb Client ID or Secret Key");
}

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: clientId! }
);
