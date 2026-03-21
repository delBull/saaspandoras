import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: clientId || "build-time-placeholder" }
);
