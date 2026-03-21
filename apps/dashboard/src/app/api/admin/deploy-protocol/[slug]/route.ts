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
import { WebhookService } from "@/lib/integrations/webhook-service";
import { integrationClients, deploymentJobs, deploymentJobStatusEnum } from "@/db/schema";
import { isAddress } from "ethers";


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

        // 2. Tokenomics Validations
        const tokenomics = reqConfig?.tokenomics;
        const totalSupply = tokenomics?.totalSupply || 1000000;
        const teamBps = tokenomics?.teamAllocationBps || 0;
        const pandorasBps = tokenomics?.pandorasAllocationBps || 0;
        const teamWallet = tokenomics?.teamWallet;
        const pandorasWallet = tokenomics?.pandorasWallet;

        if (teamBps + pandorasBps > 10000) {
            return NextResponse.json({ error: "Total allocation (Team + Pandoras) cannot exceed 100%" }, { status: 400 });
        }

        if (teamBps > 0 && (!teamWallet || !isAddress(teamWallet))) {
            return NextResponse.json({ error: `Invalid Team Wallet: ${teamWallet}` }, { status: 400 });
        }

        if (pandorasBps > 0 && (!pandorasWallet || !isAddress(pandorasWallet))) {
            return NextResponse.json({ error: `Invalid Pandoras Wallet: ${pandorasWallet}` }, { status: 400 });
        }

        if (teamBps > 0 && pandorasBps > 0 && teamWallet?.toLowerCase() === pandorasWallet?.toLowerCase()) {
            return NextResponse.json({ error: "Team and Pandoras wallets must be different" }, { status: 400 });
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
                symbol: "VHORA", 
                maxSupply: project.totalTokens || 1000,
                price: "0", 
            },
            utilityToken: {
                name: `${project.title} Utility`,
                symbol: "PHI",
                initialSupply: totalSupply, 
                maxSupply: totalSupply,
                feePercentage: reqConfig?.w2eConfig?.royaltyBPS || 100, 
                
                // Allocation context (for deployer)
                teamAllocationBps: teamBps,
                pandorasAllocationBps: pandorasBps,
                teamWallet: teamWallet,
                pandorasWallet: pandorasWallet
            },

            // Governance
            quorumPercentage: tokenomics?.votingPowerMultiplier ? Math.min(Math.max(tokenomics.votingPowerMultiplier, 10), 100) : 10,
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
            targetNetwork: network,

            // V2 Artifacts (Modular)
            artifacts: reqConfig?.artifacts || (project.w2eConfig as any)?.artifacts || [
                {
                    name: `Licencia ${project.title}`,
                    symbol: "VHORA",
                    maxSupply: project.totalTokens || 1000,
                    price: "0",
                    type: "Access"
                }
            ],
            phases: reqConfig?.phases || (project.w2eConfig as any)?.phases || []
        };

        console.log(`🚀 API: Deploying ${slug}`);
        // Debug Log
        // console.log(`🌍 Environment Detect: BRANCH=${branchName}...`); // Removed to avoid lint error
        // Already logged above at "Network Decision"

        console.log(`🚀 API: Proceeding with config (Asynchronous Job):`, config);

        // 4. Create Deployment Job
        const [job] = await db.insert(deploymentJobs).values({
            projectSlug: slug,
            network: network,
            config: config as any,
            status: "pending",
            step: "queued"
        }).returning();

        if (!job) {
            throw new Error("Failed to create deployment job in database");
        }

        // 5. Signal Deployment Service (Fire and forget-ish, or just rely on worker)
        const DEPLOY_SERVICE_URL = process.env.DEPLOY_SERVICE_URL || "http://localhost:3000";
        const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

        if (!DEPLOY_SECRET) {
            throw new Error("Missing DEPLOY_SECRET in environment variables");
        }

        console.log(`📡 Notifying deployment service for job: ${job.id}`);

        // We use a non-blocking fetch (or just let the worker pick it up if it's polling)
        // For now, we'll hit the process endpoint but not wait for it.
        fetch(`${DEPLOY_SERVICE_URL}/deploy/process-job`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-deploy-secret": DEPLOY_SECRET
            },
            body: JSON.stringify({ jobId: job.id })
        }).catch(err => console.error("⚠️ Failed to signal deployment service:", err));

        // 6. Return response
        return NextResponse.json({
            success: true,
            jobId: job?.id,
            message: "Deployment started asynchronously"
        });

    } catch (error: any) {
        console.error("Deploy API Error:", error);
        // ... (rest of error handling stays same but with safer checks)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Internal Server Error",
                details: {
                    networkAttempted: network,
                    errorDetails: error?.message || error
                }
            },
            { status: 500 }
        );
    }
}
