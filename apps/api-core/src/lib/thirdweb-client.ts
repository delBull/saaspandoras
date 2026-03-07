import { createThirdwebClient } from "thirdweb";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!secretKey && !clientId) {
    console.warn("⚠️ Warning: No Thirdweb Secret Key or Client ID found.");
} else {
    console.log(`🔌 Thirdweb Client Identity: ${secretKey ? "Secret Key (Backend Auth)" : "Client ID (Public)"}`);
}

export const client = createThirdwebClient(
    secretKey
        ? { secretKey }
        : { clientId: clientId || "" }
);
