import { getRedis } from './redis.js';
import { getContract, readContract } from "thirdweb";
import { client } from "./thirdweb-client.js";
import { config } from "../config.js";
import { PANDORAS_KEY_ABI } from "./pandoras-key-abi.js";

const ACCESS_CACHE_PREFIX = 'nft:access:';
const ACCESS_CACHE_TTL = 10 * 60; // 10 minutes in seconds

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
