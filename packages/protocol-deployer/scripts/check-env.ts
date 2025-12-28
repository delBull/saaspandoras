
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPaths = [
    ".env",
    "../../.env",
    "../../apps/dashboard/.env"
];

envPaths.forEach(p => {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
        console.log(`Loading .env from ${fullPath}`);
        dotenv.config({ path: fullPath });
    }
});

console.log("---------------------------------------------------");
console.log("Checking Deployment Configuration:");
console.log("ROOT_TREASURY_ADDRESS:", process.env.ROOT_TREASURY_ADDRESS || "NOT SET");
console.log("PANDORA_ORACLE_ADDRESS:", process.env.PANDORA_ORACLE_ADDRESS || "NOT SET");
console.log("NEXT_PUBLIC_THIRDWEB_CLIENT_ID:", process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? "SET" : "NOT SET");
console.log("PANDORA_ORACLE_PRIVATE_KEY:", process.env.PANDORA_ORACLE_PRIVATE_KEY ? "SET (Hidden)" : "NOT SET");
console.log("---------------------------------------------------");
