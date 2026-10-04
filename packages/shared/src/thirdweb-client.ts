import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;

// Fail-closed: sin credenciales no hay cliente de thirdweb (§2 y §4 de directivas).
if (!clientId && !secretKey) {
  throw new Error(
    "[Thirdweb] Credenciales ausentes: define NEXT_PUBLIC_THIRDWEB_CLIENT_ID o THIRDWEB_SECRET_KEY en el entorno."
  );
}

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: clientId as string }
);
