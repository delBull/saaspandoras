import { NextResponse } from "next/server";
import { db } from "@/db"; // Fixed import path
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth"; // Fixed auth import
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants"; // Fixed constant import
import { deployW2EProtocol } from "@pandoras/protocol-deployer";
import type { W2EConfig } from "@pandoras/protocol-deployer";
import { trackGamificationEvent } from "@/lib/gamification/service";

// Force Node.js runtime for database interactions
export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    // Diagnostic Variables (Outer Scope)
    let network: 'sepolia' | 'base' = 'sepolia'; // Default
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

        if (!userIsSuperAdmin) {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }



        // Parse Request Body for optional Config and Force Flag
        let reqConfig: any = null;
        let forceRedeploy = false;
        try {
            const body = await req.json();
            reqConfig = body.config;
            forceRedeploy = body.forceRedeploy;
        } catch (e) {
            // Body might be empty, ignore
        }

        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug),
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.deploymentStatus === 'deployed' && !forceRedeploy) {
            return NextResponse.json({ error: "Project already deployed" }, { status: 400 });
        }

        // Use Treasury Address or fallback to Applicant Wallet (Founder)
        const treasuryAddress = project.treasuryAddress || project.applicantWalletAddress;

        if (!treasuryAddress) {
            return NextResponse.json({ error: "Project Treasury Address is missing (Advisor/Founder Wallet required)" }, { status: 400 });
        }

        // 2. Prepare Configuration
        // Determine network based on Domain (Host Header) + Git Branch
        host = req.headers.get("host") || "";
        branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'unknown';

        const isProductionDomain = host === "dash.pandoras.finance" || host === "www.dash.pandoras.finance";
        const isMainBranch = branchName === 'main';
        const isStagingBranch = branchName === 'staging';

        // Network Logic: 
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

        // Debug Env Vars (Safety Check)
        const hasSepoliaRPC = !!process.env.SEPOLIA_RPC_URL;
        const hasBaseRPC = !!process.env.BASE_RPC_URL;

        console.log(`🚀 API: Deploying ${slug}`);
        console.log(`🌍 Network Decision: Host="${host}", Branch="${branchName}" → Network="${network}"`);
        console.log(`🔌 RPC Check: SEPOLIA_RPC_URL=${hasSepoliaRPC ? 'OK' : 'MISSING'}, BASE_RPC_URL=${hasBaseRPC ? 'OK' : 'MISSING'}`);

        // Mapping project data to W2EConfig
        const config: W2EConfig = {
            // General Protocol
            protocolName: project.title,
            protocolCategory: project.businessCategory || "uncategorized",

            // Token Config
            licenseToken: {
                name: `Licencia ${project.title}`,
                symbol: "VHORA", // Using standard symbol or custom if needed
                maxSupply: project.totalTokens || 1000,
                price: "0", // Access Cards (Licenses) are always FREE. Revenue comes from Token Sales, not Access.
            },
            utilityToken: {
                name: `${project.title} Utility`,
                symbol: "PHI", // Standard utility symbol
                initialSupply: reqConfig?.tokenomics?.initialSupply || 0, // Minted via W2E
                feePercentage: 100, // 1% (basis points usually 100 = 1%)
            },

            // Governance
            quorumPercentage: reqConfig?.tokenomics?.votingPowerMultiplier ? Math.min(Math.max(reqConfig.tokenomics.votingPowerMultiplier, 10), 100) : 10, // Must be >= 10
            votingDelaySeconds: 0,
            votingPeriodHours: 24, // 1 day
            executionDelayHours: 24, // 1 day timelock
            emergencyPeriodHours: 168, // 7 days (Minimum required by contract)
            emergencyQuorumPct: 10,

            // Economics
            platformFeePercentage: 0.05, // 5%
            stakingRewardRate: "1000000000000000", // 0.001 tokens/sec placeholder
            phiFundSplitPct: 10,
            maxLicenses: project.totalTokens || 1000,
            treasurySigners: [treasuryAddress],

            // Capital Distribution
            creatorWallet: treasuryAddress,
            creatorPayoutPct: 50, // 50% release
            targetAmount: project.targetAmount ? project.targetAmount.toString() : "0",
            payoutWindowSeconds: 60 * 60 * 24 * 7, // 7 days

            // Lifecycle
            inactivityThresholdSeconds: 60 * 60 * 24 * 30, // 30 days

            // Network
            targetNetwork: network
        };

        console.log(`🚀 API: Deploying ${slug}`);
        // Debug Log
        // console.log(`🌍 Environment Detect: BRANCH=${branchName}...`); // Removed to avoid lint error
        // Already logged above at "Network Decision"

        console.log(`🚀 API: Proceeding with config (via Railway Service):`, config);

        // 4. Delegate to Deployment Service
        const DEPLOY_SERVICE_URL = process.env.DEPLOY_SERVICE_URL || "http://localhost:3000";
        const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

        if (!DEPLOY_SECRET) {
            throw new Error("Missing DEPLOY_SECRET in environment variables");
        }

        console.log(`📡 Forwarding deployment to: ${DEPLOY_SERVICE_URL}/deploy/protocol`);

        const deployResponse = await fetch(`${DEPLOY_SERVICE_URL}/deploy/protocol`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-deploy-secret": DEPLOY_SECRET
            },
            body: JSON.stringify({ slug, config, network })
        });

        if (!deployResponse.ok) {
            const errorText = await deployResponse.text();
            throw new Error(`Deployment Service failed: ${deployResponse.status} ${deployResponse.statusText} - ${errorText}`);
        }

        const deployResult = await deployResponse.json();

        if (!deployResult.success || !deployResult.deployment) {
            throw new Error(`Deployment Service returned failure: ${deployResult.error || "Unknown error"}`);
        }

        const result = deployResult.deployment;
        console.log("✅ Deployment Result (from Service):", result);

        // Prepare Extended Config for DB (includes UI-specific fields not used by deployer)
        const extendedConfig = {
            ...config,
            phases: reqConfig?.phases || [],
            tokenomics: reqConfig?.tokenomics || {}, // Store raw tokenomics from UI
            accessCardImage: reqConfig?.accessCardImage,
            timelockAddress: result.timelockAddress // Store timelock in config since we lack a column
        };

        // 5. Update Database
        await db.update(projects)
            .set({
                licenseContractAddress: result.licenseAddress,
                utilityContractAddress: result.phiAddress,
                loomContractAddress: result.loomAddress,
                votingContractAddress: result.governorAddress,
                treasuryAddress: result.treasuryAddress,
                chainId: result.chainId,
                deploymentStatus: 'deployed',
                status: 'live', // Auto-set to live on deployment (User Request)
                w2eConfig: extendedConfig,
            })
            .where(eq(projects.slug, slug));

        // 6. Gamification: Award 500 points for deploying protocol
        if (project.applicantWalletAddress) {
            try {
                await trackGamificationEvent(
                    project.applicantWalletAddress,
                    'protocol_deployed',
                    {
                        projectId: project.id.toString(),
                        projectSlug: slug,
                        network: network,
                        timestamp: new Date().toISOString()
                    }
                );
                console.log(`🎯 Gamification event tracked: protocol_deployed for ${project.applicantWalletAddress}`);
            } catch (gamificationError) {
                console.warn('⚠️ Failed to track gamification event:', gamificationError);
            }
        }

        return NextResponse.json({ success: true, deployment: result });

    } catch (error: any) {
        console.error("Deploy API Error:", error);

        // Diagnostic Info
        const diagnostics = {
            networkAttempted: network,
            envDetection: {
                host: host,
                vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
                branch: branchName
            },
            rpcStatus: {
                sepolia: process.env.SEPOLIA_RPC_URL ? `Configured (Length: ${process.env.SEPOLIA_RPC_URL.length})` : 'MISSING',
                base: process.env.BASE_RPC_URL ? `Configured (Length: ${process.env.BASE_RPC_URL.length})` : 'MISSING'
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
