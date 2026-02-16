import { getRedis } from './redis.js';
import { getContract, readContract } from "thirdweb";
import { client } from "./thirdweb-client.js";
import { config } from "../config.js";
import { PANDORAS_KEY_ABI } from "./pandoras-key-abi.js";
import { Chain } from "thirdweb/chains";

const ACCESS_CACHE_PREFIX = 'nft:access:';
const ACCESS_CACHE_TTL = 10 * 60; // 10 minutes in seconds
const NFT_BALANCE_CACHE_PREFIX = 'nft:balance:';
const NFT_BALANCE_CACHE_TTL = 10 * 60; // 10 minutes

/**
 * Get NFT gate status with caching
 * Reduces RPC calls by caching the result
 */
export async function getGateHolderStatus(address: string): Promise<boolean> {
    const redis = getRedis();
    const cacheKey = `${ACCESS_CACHE_PREFIX}${address.toLowerCase()}`;
    
    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
            console.log(`[NFT Cache] HIT for ${address}`);
            return cached === 'true';
        }
        
        console.log(`[NFT Cache] MISS for ${address} - fetching from chain`);
        
        // Fetch from chain using config
        const contract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress,
            abi: PANDORAS_KEY_ABI
        });
        
        let hasAccess = false;
        try {
            hasAccess = await readContract({
                contract,
                method: "isGateHolder",
                params: [address]
            });
        } catch (e) {
            console.error("[NFT Cache] Contract call failed:", e);
            hasAccess = false;
        }
        
        // Cache the result
        await redis.setex(cacheKey, ACCESS_CACHE_TTL, hasAccess.toString());
        
        return hasAccess;
    } catch (error) {
        console.error("[NFT Cache] Error:", error);
        // On error, return false (fail closed)
        return false;
    }
}

/**
 * Invalidate cache for an address
 * Call this when you suspect ownership has changed
 */
export async function invalidateAccessCache(address: string): Promise<void> {
    const redis = getRedis();
    const cacheKey = `${ACCESS_CACHE_PREFIX}${address.toLowerCase()}`;
    await redis.del(cacheKey);
    console.log(`[NFT Cache] Invalidated for ${address}`);
}

/**
 * Invalidate all NFT caches (useful for contract upgrades)
 */
export async function invalidateAllAccessCache(): Promise<void> {
    const redis = getRedis();
    const keys = await redis.keys(`${ACCESS_CACHE_PREFIX}*`);
    if (keys.length > 0) {
        await redis.del(keys);
        console.log(`[NFT Cache] Invalidated ${keys.length} keys`);
    }
}

/**
 * Pre-warm cache for multiple addresses
 * Useful after a batch mint or airdrop
 */
export async function prewarmCache(addresses: string[]): Promise<void> {
    console.log(`[NFT Cache] Pre-warming cache for ${addresses.length} addresses`);
    
    const promises = addresses.map(addr => getGateHolderStatus(addr));
    await Promise.all(promises);
    
    console.log(`[NFT Cache] Pre-warming complete`);
}

/**
 * Get NFT balance for any contract with caching
 * Used by tenant-gate for multi-contract gating
 * 
 * Note: This uses isGateHolder as the primary method for compatibility
 * For other contracts, you would need to add their ABIs
 */
export async function getNFTBalanceCached(
    contractAddress: string,
    chainId: number,
    holder: string
): Promise<number> {
    const redis = getRedis();
    const cacheKey = `${NFT_BALANCE_CACHE_PREFIX}${contractAddress.toLowerCase()}:${chainId}:${holder.toLowerCase()}`;
    
    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
            console.log(`[NFT Balance Cache] HIT for ${holder} on ${contractAddress}`);
            return parseInt(cached, 10);
        }
        
        console.log(`[NFT Balance Cache] MISS for ${holder} on ${contractAddress}`);
        
        // Use config chain for all contracts for now
        const chain = config.chain;
        
        // Check if this is the main Pandoras Key contract
        const isMainContract = contractAddress.toLowerCase() === config.nftContractAddress.toLowerCase();
        const abi = isMainContract ? PANDORAS_KEY_ABI : PANDORAS_KEY_ABI;
        
        // Fetch from chain
        const contract = getContract({
            client,
            chain,
            address: contractAddress,
            abi
        });
        
        let balance = 0;
        try {
            // Use isGateHolder - returns true/false (1/0)
            const hasAccess = await readContract({
                contract,
                method: "isGateHolder",
                params: [holder]
            });
            balance = hasAccess ? 1 : 0;
        } catch (e) {
            console.error("[NFT Balance Cache] Contract call failed:", e);
            balance = 0;
        }
        
        // Cache the result
        await redis.setex(cacheKey, NFT_BALANCE_CACHE_TTL, balance.toString());
        
        return balance;
    } catch (error) {
        console.error("[NFT Balance Cache] Error:", error);
        // On error, return 0 (fail closed)
        return 0;
    }
}
