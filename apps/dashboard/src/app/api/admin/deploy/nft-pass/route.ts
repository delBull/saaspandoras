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
        const { name, symbol, maxSupply, price, owner, treasuryAddress, oracleAddress, image } = body;

        if (!name || !symbol || !owner) {
            return NextResponse.json({ error: "Missing required fields (name, symbol, owner)" }, { status: 400 });
        }

        const config: NFTPassConfig = {
            name,
            symbol,
            maxSupply: Number(maxSupply) || 1000,
            price: price ? String(price) : "0",
            owner,
            treasuryAddress,
            oracleAddress
        };

        console.log(`🚀 API: Deploying NFT Pass: ${name} (${symbol}) for ${owner}`);

        // 3. Determine Network (same logic as deploy-protocol)
        const host = req.headers.get("host") || "";
        const branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'unknown';

        const isProductionDomain = host === "dash.pandoras.finance" || host === "www.dash.pandoras.finance";
        const isMainBranch = branchName === 'main';

        // Network: Production domain or main branch → Base, else Sepolia
        const network = (isProductionDomain || isMainBranch) ? 'base' : 'sepolia';

        console.log(`🌍 Network Decision: Host="${host}", Branch="${branchName}" → Network="${network}"`);

        const address = await deployNFTPass(config, network);

        console.log("✅ Deployment Result:", address);

        // 4. Create Project Record (for Metadata API integration)
        // Generate a slug from name + random suffix to avoid collisions
        const slug = `pass-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

        await db.insert(projects).values({
            title: name,
            slug: slug,
            description: `System Access Pass: ${name}. Symbol: ${symbol}`,
            // We use 'infrastructure' or 'other' as category
            businessCategory: 'infrastructure',
            // Set status to live or approved so it shows up? Or keep it specific.
            // Deployment status is deployed.
            deploymentStatus: 'deployed',
            licenseContractAddress: address,
            applicantWalletAddress: owner,
            treasuryAddress: treasuryAddress || owner,
            w2eConfig: {
                licenseToken: { name, symbol, maxSupply: Number(maxSupply), price: price || "0" },
                accessCardImage: image || null // Store the image for metadata!
            },
            status: 'live', // Active by default
            isMintable: true,
            totalTokens: Number(maxSupply),
            // Minimal required fields
            targetAmount: "0",
        });

        return NextResponse.json({ success: true, address, network, slug });

    } catch (error) {
        console.error("Deploy NFT API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
