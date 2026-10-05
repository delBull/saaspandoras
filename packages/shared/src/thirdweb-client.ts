import { createThirdwebClient } from "thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;
const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';
const isTest = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test';

// Fail-closed: sin credenciales no hay cliente de thirdweb (§2 y §4 de directivas), 
// excepto en build-time o tests para no romper pipelines.
if (!clientId && !secretKey && !isBuild && !isTest) {
  throw new Error(
    "[Thirdweb] Credenciales ausentes: define NEXT_PUBLIC_THIRDWEB_CLIENT_ID o THIRDWEB_SECRET_KEY en el entorno."
  );
}

export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : { clientId: (clientId || "mock_bafkrei_build") as string }
);
