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
            timeout: 6000, // ⚡ 6s strict timeout to prevent Vercel hangs
        });

        // 🛡️ Optimisation: 1x Retry for laggy RPC Nodes (ONLY READS)
        const originalSend = provider.send.bind(provider);
        provider.send = async (method: string, params: Array<any>) => {
            try {
                return await originalSend(method, params);
            } catch (error) {
                // ⚠️ CRITICAL: Do not retry mutations/transactions to prevent double-spends
                if (method === 'eth_sendRawTransaction' || method === 'eth_sendTransaction') {
                    console.error(`❌ RPC Mutation failed for method: ${method}, ABORTING RETRY`);
                    throw error;
                }
                console.warn(`🔄 RPC Retry (1x) triggered for READ method: ${method}`);
                return await originalSend(method, params);
            }
        };
        console.log("🔌 RPC Provider singleton initialized with 6s timeout");
    }
    return provider;
}
