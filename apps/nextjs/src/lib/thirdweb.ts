import { createThirdwebClient } from "thirdweb";
import { env } from "~/env.mjs";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});
