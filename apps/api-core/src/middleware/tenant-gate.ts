import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/db.js';
import { tenants, tenantUsers, type TenantConfig, type NFTContractConfig } from '../db/schema-extended.js';
import { eq, and } from 'drizzle-orm';
import { getNFTBalanceCached } from '../lib/nft-cache.js';
import { config } from '../config.js';

// Default tenant ID for Pandoras main platform
const DEFAULT_TENANT_ID = 'pandoras-main';

/**
 * Extract tenant ID from request
 * Priority: 1. Header X-Tenant-ID, 2. Subdomain, 3. Default
 */
export function getTenantId(req: Request): string {
    // Check header first
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
        return headerTenantId.toLowerCase();
    }
    
    // Check subdomain (for future multi-domain support)
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'staging' && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain.toLowerCase();
    }
    
    // Default to main tenant
    return DEFAULT_TENANT_ID;
}

/**
 * Get tenant configuration from database
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId)
    });
    
    if (!tenant || !tenant.isActive) {
        return null;
    }
    
    return tenant.config as TenantConfig;
}

/**
 * Check if user has required roles for tenant
 */
export async function checkUserRoles(
    userId: string, 
    tenantId: string, 
    requiredRoles: string[]
): Promise<boolean> {
    if (requiredRoles.length === 0) {
        return true; // No roles required
    }
    
    const userTenant = await db.query.tenantUsers.findFirst({
        where: and(
            eq(tenantUsers.userId, userId.toLowerCase()),
            eq(tenantUsers.tenantId, tenantId)
        )
    });
    
    if (!userTenant || !userTenant.isActive) {
        return false;
    }
    
    const userRoles = userTenant.roles as string[];
    return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check NFT ownership with caching
 */
export async function checkNFTOwnership(
    address: string,
    nftConfigs: NFTContractConfig[]
): Promise<boolean> {
    for (const nftConfig of nftConfigs) {
        try {
            const balance = await getNFTBalanceCached(
                nftConfig.address,
                nftConfig.chainId,
                address
            );
            
            if (balance >= nftConfig.minBalance) {
                return true;
            }
        } catch (error) {
            console.error(`[TenantGate] Error checking NFT ${nftConfig.address}:`, error);
            // Continue checking other NFTs
        }
    }
    
    return false;
}

/**
 * Check if address is whitelisted
 */
export function isWhitelisted(address: string, whitelist: string[]): boolean {
    return whitelist.some(
        whitelisted => whitelisted.toLowerCase() === address.toLowerCase()
    );
}

/**
 * Main tenant access check function
 */
export async function checkTenantAccess(
    address: string,
    tenantId: string
): Promise<{
    hasAccess: boolean;
    reason?: string;
    requirements?: {
        nftContracts?: NFTContractConfig[];
        requiredRoles?: string[];
    };
}> {
    // Get tenant configuration
    const tenantConfig = await getTenantConfig(tenantId);
    
    // If no tenant found or inactive, deny access (or allow for default)
    if (!tenantConfig && tenantId !== DEFAULT_TENANT_ID) {
        return {
            hasAccess: false,
            reason: 'TENANT_NOT_FOUND',
            requirements: {}
        };
    }
    
    // If no config, use default (Pandoras Key)
    const config = tenantConfig || {
        nftContracts: [{
            address: process.env.NFT_CONTRACT_ADDRESS || '',
            chainId: parseInt(process.env.CHAIN_ID || '11155111'),
            minBalance: 1
        }],
        minTokenBalance: "0",
        requiredRoles: [],
        whitelistedAddresses: []
    };
    
    // 1. Check whitelist first (bypass all other checks)
    if (isWhitelisted(address, config.whitelistedAddresses)) {
        return { hasAccess: true };
    }
    
    // 2. Check roles
    if (config.requiredRoles.length > 0) {
        const hasRoles = await checkUserRoles(address, tenantId, config.requiredRoles);
        if (hasRoles) {
            return { hasAccess: true };
        }
    }
    
    // 3. Check NFT ownership
    if (config.nftContracts.length > 0) {
        const hasNFT = await checkNFTOwnership(address, config.nftContracts);
        if (hasNFT) {
            return { hasAccess: true };
        }
    }
    
    // 4. Check token balance (if configured)
    if (config.minTokenBalance && config.minTokenBalance !== "0") {
        // For now, skip native token balance check
        // Could implement using RPC call to getBalance
    }
    
    // Access denied
    return {
        hasAccess: false,
        reason: 'INSUFFICIENT_PERMISSIONS',
        requirements: {
            nftContracts: config.nftContracts,
            requiredRoles: config.requiredRoles
        }
    };
}

/**
 * Express middleware for tenant gating
 */
export function tenantGate(req: Request, res: Response, next: NextFunction) {
    const tenantId = getTenantId(req);
    const address = (req as any).user?.address || req.body?.address || req.query?.address;
    
    // If no address, skip gate (let auth handle it)
    if (!address) {
        return next();
    }
    
    // Attach tenant info to request
    (req as any).tenantId = tenantId;
    
    checkTenantAccess(address.toLowerCase(), tenantId)
        .then(result => {
            if (!result.hasAccess) {
                (req as any).tenantAccessDenied = result;
            }
            next();
        })
        .catch(error => {
            console.error('[TenantGate] Error:', error);
            // On error, allow through (fail open for UX)
            next();
        });
}

/**
 * Middleware to require tenant access
 */
export function requireTenantAccess(req: Request, res: Response, next: NextFunction) {
    const denied = (req as any).tenantAccessDenied;
    
    if (denied) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: denied.reason,
            requirements: denied.requirements,
            tenantId: (req as any).tenantId
        });
    }
    
    next();
}
