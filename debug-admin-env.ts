
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./apps/dashboard/src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/dashboard/.env" });

// Mock SUPER_ADMIN_WALLET from constants (hardcoded fallback check)
const ENV_SUPER_ADMIN = process.env.SUPER_ADMIN_WALLET;
const HARDCODED_FALLBACK = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";

console.log("--- Admin Auth Debug ---");
console.log(`ENV SUPER_ADMIN_WALLET: '${ENV_SUPER_ADMIN}'`);
console.log(`Effective SUPER_ADMIN: '${ENV_SUPER_ADMIN ?? HARDCODED_FALLBACK}'`);

// Check if empty string match
const testWallet = "0xUserWalletAddress"; // Simulate user
console.log(`Test: Is '${testWallet}' super admin? => ${testWallet.toLowerCase() === (ENV_SUPER_ADMIN ?? HARDCODED_FALLBACK).toLowerCase()}`);

// Check if ENV is empty string
if (ENV_SUPER_ADMIN === "") {
    console.log("⚠️ WARNING: SUPER_ADMIN_WALLET is set to EMPTY STRING in .env");
    console.log("This might cause 'something'.toLowerCase() === ''.toLowerCase() if logic is flawed, but normally it shouldn't match.");
}

console.log("Done.");
