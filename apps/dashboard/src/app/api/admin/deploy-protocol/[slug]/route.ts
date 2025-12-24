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
        // Determine network first
        // Priority 1: Check Git Branch Name (Reliable for Staging/Dev branches deployed as Prod)
        const branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || '';
        const isStagingBranch = ['staging', 'dev', 'development', 'release/staging'].some(b => branchName.includes(b));

        // Priority 2: Check Vercel Env
        const isVercelProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

        // Logic: It is Mainnet ONLY if it's Vercel Prod AND NOT a Staging Branch
        const isMainnet = isVercelProd && !isStagingBranch;

        const network = isMainnet ? 'base' : 'sepolia';

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
        console.log(`🌍 Environment Detect: BRANCH=${branchName}, VERCEL_ENV=${process.env.NEXT_PUBLIC_VERCEL_ENV}, NODE_ENV=${process.env.NODE_ENV} -> Network: ${network}`);

        console.log(`🚀 API: Proceeding with config:`, config);

        // 4. Call Deployer
        const result = await deployW2EProtocol(slug, config, network);

        console.log("✅ Deployment Result:", result);

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

    } catch (error) {
        console.error("Deploy API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
