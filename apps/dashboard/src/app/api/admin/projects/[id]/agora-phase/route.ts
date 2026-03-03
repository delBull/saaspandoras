import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, protocolConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { ethers } from "ethers";

export const runtime = "nodejs";

const W2EUtilityABI = [
    { inputs: [], name: 'enableTransfers', outputs: [], stateMutability: 'nonpayable', type: 'function' }
];

const W2ELicenseABI = [
    { inputs: [{ internalType: "bool", name: "_status", type: "bool" }], name: 'setIsTransferable', outputs: [], stateMutability: 'nonpayable', type: 'function' }
];

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = Number(id);

        if (isNaN(projectId)) {
            return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
        }

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

        // 2. Fetch Project & Config
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const config = await db.query.protocolConfigs.findFirst({
            where: eq(protocolConfigs.protocolId, projectId),
        });

        if (!config) {
            return NextResponse.json({ error: "Protocol config not found" }, { status: 404 });
        }

        if (config.marketPhase === 'defense') {
            return NextResponse.json({ error: "Protocol is already in AGORA Market (Defense Phase)" }, { status: 400 });
        }

        // 3. Smart Contract Integration (One-Click Atomic Transfer)
        const privateKey = process.env.PANDORA_CORE_KEY;
        const rpcUrl = project.chainId === 11155111 || project.chainId === 84532 ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;

        if (privateKey && rpcUrl && project.licenseContractAddress && project.utilityContractAddress) {
            try {
                console.log(`🚀 API: Initiating Atomic Phase Transition for Project ${projectId}`);
                const provider = new ethers.providers.JsonRpcProvider(rpcUrl as string);
                const wallet = new ethers.Wallet(privateKey, provider);

                // Enable transfers on Utility Contract
                const utilityContract = new ethers.Contract(project.utilityContractAddress, W2EUtilityABI, wallet);
                const tx1 = await utilityContract.enableTransfers();
                console.log(`🚀 API: Sent tx1 (Utility enableTransfers): ${tx1.hash}`);

                // Enable transfers on License Contract
                const licenseContract = new ethers.Contract(project.licenseContractAddress, W2ELicenseABI, wallet);
                const tx2 = await licenseContract.setIsTransferable(true);
                console.log(`🚀 API: Sent tx2 (License setIsTransferable): ${tx2.hash}`);

                await tx1.wait();
                await tx2.wait();
                console.log(`✅ API: Both transactions confirmed.`);
            } catch (err: any) {
                console.error("⚠️ Failed to invoke smart contracts. Still updating DB if requested, or aborting. Error:", err);
                return NextResponse.json({ error: "Smart contract execution failed: " + err.message }, { status: 500 });
            }
        } else {
            console.warn("⚠️ API: Missing contract addresses or RPC/Key. Skipping blockchain execution, proceeding with Database only.");
        }

        // 4. Update Database
        await db.update(protocolConfigs)
            .set({
                marketPhase: 'defense',
                readySince: new Date(),
                updatedAt: new Date()
            })
            .where(eq(protocolConfigs.protocolId, config.protocolId));

        console.log(`✅ API: Database updated to phase: defense for Project ${projectId}`);

        return NextResponse.json({ success: true, message: "Phase successfully transitioned to AGORA Market (Defense)" });
    } catch (error: any) {
        console.error("Phase Transition API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
