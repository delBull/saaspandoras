import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../apps/dashboard/.env.local") });

export const ENV = {
  RPC_URL: "https://ethereum-sepolia.publicnode.com",
  ADMIN_KEY: process.env.PROTOCOL_ADMIN_PRIVATE_KEY,
  DELEGATE_KEY: process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY_ORACLE_RELAYER || process.env.PANDORA_ORACLE_PRIVATE_KEY,
  CONTROLLER: process.env.ALLOWANCE_CONTROLLER_ADDRESS || "0x2E15a2e05a7d7399dB003e014aCB1De03Cea5cc9",
  USDC: process.env.USDC_SEPOLIA_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  ADMIN: "0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6",
  DB_URL: process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL,
  API_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  PROJECT_OWNER: "0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6", // admin is project owner
  TEST_USER1: "0x96631D6c5295F1f08334888C5D6f3a246fa9C3bA",
  TEST_USER2: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  PROJECT_ID: 1,
};

export function checkEnv() {
  const missing = [];
  if (!ENV.ADMIN_KEY) missing.push("PROTOCOL_ADMIN_PRIVATE_KEY");
  if (!ENV.DELEGATE_KEY) missing.push("RELAYER_PRIVATE_KEY or PANDORA_ORACLE_PRIVATE_KEY");
  if (!ENV.DB_URL) missing.push("DATABASE_URL");
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);
}
