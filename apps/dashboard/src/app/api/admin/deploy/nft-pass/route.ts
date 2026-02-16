import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { deployNFTPass, type NFTPassConfig } from "@pandoras/protocol-deployer";

// Force Node.js runtime for database/blockchain interactions
export const runtime = "nodejs";

export async function POST(req: Request) {
    // Diagnostic Variables (Outer Scope for Error Handling)
    let network: 'sepolia' | 'base' = 'sepolia';
    let host = '';
    let branchName = '';

    try {
        // 1. Auth & Admin Check
        const headersObj = await headers();
        const { session } = await getAuth(headersObj);

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userIsSuperAdmin = session.userId.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();

        // Allow Super Admin OR verified admins (simplified here to Super Admin for critical actions, but can relax)
        // For now, strict check like deploy-protocol to be safe
        if (!userIsSuperAdmin) {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }

        // 2. Parse Config
        const body = await req.json();
        const { 
            name, 
            symbol, 
            maxSupply, 
            price, 
            owner, 
            treasuryAddress, 
            oracleAddress, 
            image, 
            description, 
            nftType = 'access', 
            targetUrl = null,
            createLanding = false, 
            landingConfig = null 
        } = body;

        if (!name || !symbol || !owner) {
            return NextResponse.json({ error: "Missing required fields (name, symbol, owner)" }, { status: 400 });
        }

        // 3. Configure Deployment
        const MAX_UINT256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
        const isInfiniteSupply = String(maxSupply) === MAX_UINT256;

        const config: NFTPassConfig = {
            name,
            symbol,
            maxSupply: maxSupply, // Pass string directly to deployer (which now supports string | number)
            price: price ? String(price) : "0",
            owner,
            treasuryAddress,
            oracleAddress
        };

        console.log(`🚀 API: Deploying NFT Pass: ${name} (${symbol}) for ${owner}. Supply: ${isInfiniteSupply ? "UNLIMITED" : maxSupply}. Type: ${nftType}`);

        // 3. Determine Network (same logic as deploy-protocol)
        host = req.headers.get("host") || "";
        branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'unknown';

        const isProductionDomain = host === "dash.pandoras.finance" || host === "www.dash.pandoras.finance";
        const isMainBranch = branchName === 'main';
        const isStagingBranch = branchName === 'staging';

        // Network: Production domain or main branch → Base, else Sepolia
        // Logic: 
        // 1st Priority: Domain name (most reliable for Vercel)
        // 2nd Priority: Branch name (main = base, staging = sepolia)
        // Default: Sepolia (safe fallback)
        if (isProductionDomain || isMainBranch) {
            network = 'base';
        } else if (isStagingBranch) {
            network = 'sepolia';
        } else {
            // Unknown environment, default to Sepolia for safety
            network = 'sepolia';
        }

        console.log(`🌍 Network Decision: Host="${host}", Branch="${branchName}" → Network="${network}"`);

        const address = await deployNFTPass(config, network);

        console.log("✅ Deployment Result:", address);

        // 4. Create Project Record (for Metadata API integration)
        // Generate a slug from name + random suffix to avoid collisions
        const slug = `pass-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
        const shortlinkType = createLanding ? 'landing' : 'redirect';

        await db.insert(projects).values({
            title: name,
            slug: slug,
            description: description || `System Access Pass: ${name}. Symbol: ${symbol}`,
            // We use 'infrastructure' or 'other' as category
            businessCategory: 'infrastructure',
            // Set status to live or approved so it shows up? Or keep it specific.
            // Deployment status is deployed.
            deploymentStatus: 'deployed',
            licenseContractAddress: address,
            applicantWalletAddress: owner,
            treasuryAddress: treasuryAddress || owner,
            w2eConfig: {
                licenseToken: {
                    name,
                    symbol,
                    type: nftType, // Store the type ('qr', 'access', 'identity', etc.)
                    maxSupply: isInfiniteSupply ? "Unlimited" : Number(maxSupply), // Store clearer string for JSON or Number if finite
                    price: price || "0",
                    // New traits
                    transferable: body.transferable ?? true,
                    burnable: body.burnable ?? false,
                    validUntil: body.validUntil || null,
                    // New fields for shortlink creation
                    shortlinkType: shortlinkType || null, // 'landing' or 'redirect'
                    landingConfig: landingConfig || null, // Configuration for landing page if shortlinkType is 'landing'
                    targetUrl: targetUrl // Target URL for Smart QR redirects
                },
                accessCardImage: image || null, // Store the image for metadata!
                smartQRDestination: targetUrl // Store Smart QR destination separately for easy access
            },
            status: 'live', // Active by default
            isMintable: true,
            totalTokens: isInfiniteSupply ? -1 : Number(maxSupply), // -1 for Unlimited to avoid Integer Overflow in DB
            // Minimal required fields
            targetAmount: "0",
        });

        return NextResponse.json({ success: true, address, network, slug });

    } catch (error: any) {
        console.error("Deploy NFT API Error:", error);

        // Diagnostic Info
        const diagnostics = {
            networkAttempted: network,
            envDetection: {
                host: host,
                vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
                branch: branchName
            },
            rpcStatus: {
                sepolia: process.env.SEPOLIA_RPC_URL ? `Configured (Custom)` : 'Using Internal Fallbacks',
                base: process.env.BASE_RPC_URL ? `Configured (Custom)` : 'Using Internal Fallbacks'
            },
            rpcEnvVars: {
                SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL ? 'Present' : 'Missing',
                BASE_RPC_URL: process.env.BASE_RPC_URL ? 'Present' : 'Missing'
            },
            errorDetails: error?.message || error
        };

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Internal Server Error",
                details: diagnostics
            },
            { status: 500 }
        );
    }
}
