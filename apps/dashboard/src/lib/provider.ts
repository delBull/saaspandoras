import { ethers } from "ethers";

let provider: ethers.providers.JsonRpcProvider | null = null;

/**
 * Singleton RPC Provider to avoid multiple instantiations per request.
 */
export function getProvider() {
    if (!provider) {
        const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
        if (!rpcUrl) {
            console.error("❌ Missing RPC_URL environment variable");
            // Fallback to a default if absolutely necessary, or let it fail
        }
        provider = new ethers.providers.JsonRpcProvider({
            url: rpcUrl!,
            timeout: 4000, // ⚡ 4s strict timeout to prevent Vercel hangs
        });
        console.log("🔌 RPC Provider singleton initialized with 4s timeout");
    }
    return provider;
}
