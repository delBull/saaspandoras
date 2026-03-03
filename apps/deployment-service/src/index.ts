import express from "express";
import dotenv from "dotenv";
import { deployNFTPassServer, deployW2EProtocol, NetworkType, NFTPassConfig, W2EConfig } from "@pandoras/protocol-deployer";
import { db, schema } from "./db.js";
import { eq, and, lt } from "drizzle-orm";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

if (!DEPLOY_SECRET) {
    throw new Error("DEPLOY_SECRET missing");
}

app.get("/health", (_, res) => {
    res.json({ status: "ok" });
});

// Helper to update job status
async function updateJob(jobId: string, data: Partial<typeof schema.deploymentJobs.$inferInsert>) {
    try {
        await db.update(schema.deploymentJobs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.deploymentJobs.id, jobId));
    } catch (err) {
        console.error(`❌ Failed to update job ${jobId}:`, err);
    }
}

// Concurrency Guard
let activeJobsCount = 0;
const MAX_CONCURRENCY = 1;

// Structured Event Logger Helper
function logEvent(jobId: string, event: string, extra: any = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        jobId,
        event,
        ...extra
    }));
}

// Background Worker Logic (Hardened)
async function runDeploymentJob(jobId: string) {
    if (activeJobsCount >= MAX_CONCURRENCY) {
        logEvent(jobId, "QUEUE_FULL", { activeCount: activeJobsCount });
        return;
    }

    // 1. ATOMIC LOCK (Compare-and-Swap)
    // We only process if status is 'pending'
    const [job] = await db.update(schema.deploymentJobs)
        .set({
            status: 'processing' as any,
            startedAt: new Date(),
            step: 'starting'
        })
        .where(eq(schema.deploymentJobs.id, jobId as any))
        .returning();

    // If no rows returned, someone else took it or it's not pending
    if (!job) {
        logEvent(jobId, "JOB_LOCKED_OR_NOT_PENDING");
        return;
    }

    activeJobsCount++;
    logEvent(jobId, "DEPLOY_START", { projectSlug: job.projectSlug, network: job.network });

    try {
        // Step 1: Broadcasting
        logEvent(jobId, "DEPLOY_STEP", { step: "broadcasting" });
        await updateJob(jobId, { step: 'broadcasting' });

        // Execute the actual deployment (Burst Parallel strategy internally)
        const result = await deployW2EProtocol(
            job.projectSlug,
            job.config as W2EConfig,
            job.network as NetworkType
        );

        // Step 2: Finalizing
        logEvent(jobId, "DEPLOY_STEP", { step: "finalizing" });
        await updateJob(jobId, { step: 'finalizing' });

        // CRITICAL: Update the Project record
        await db.update(schema.projects)
            .set({
                licenseContractAddress: result.licenseAddress || (result.artifacts?.[0]?.address),
                utilityContractAddress: result.phiAddress,
                loomContractAddress: result.loomAddress,
                governorContractAddress: result.governorAddress,
                registryContractAddress: result.registryAddress,
                artifacts: result.artifacts as any,
                protocolVersion: 2,
                treasuryAddress: result.treasuryAddress,
                chainId: result.chainId,
                deploymentStatus: 'deployed',
                status: 'live',
            })
            .where(eq(schema.projects.slug, job.projectSlug));

        // Finalize Job
        await updateJob(jobId, {
            status: 'completed' as any,
            step: 'completed',
            result: result as any
        });

        logEvent(jobId, "DEPLOY_SUCCESS", { addresses: result });

    } catch (err: any) {
        logEvent(jobId, "DEPLOY_ERROR", { error: err.message });
        await updateJob(jobId, {
            status: 'failed' as any,
            error: err.message || "Unknown error during async deployment"
        });
    } finally {
        activeJobsCount--;
    }
}

// Zombie Cleanup Logic (Runs every 5 mins)
async function cleanupZombies() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const zombies = await db.update(schema.deploymentJobs)
        .set({
            status: 'failed' as any,
            error: 'JOB_ZOMBIE: Process likely crashed or timed out'
        })
        .where(and(
            eq(schema.deploymentJobs.status, 'processing'),
            lt(schema.deploymentJobs.startedAt, tenMinutesAgo)
        ))
        .returning();

    if (zombies.length > 0) {
        console.log(`🧹 Cleanup: Marked ${zombies.length} zombie jobs as failed.`);
    }
}

// Start periodic cleanup
setInterval(() => {
    cleanupZombies().catch(err => console.error("Cleanup error:", err));
}, 5 * 60 * 1000);

app.post("/deploy/process-job", async (req, res) => {

    if (req.headers["x-deploy-secret"] !== DEPLOY_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    // Start background process without awaiting
    runDeploymentJob(jobId).catch(err => console.error("Worker error:", err));

    return res.json({ success: true, message: "Job processing started" });
});

app.post("/deploy/nft-pass", async (req, res) => {
    // ... (Keep existing sync endpoint for simpler NFT passes if preferred, or refactor later)
    res.setTimeout(120_000);
    if (req.headers["x-deploy-secret"] !== DEPLOY_SECRET) return res.status(401).json({ error: "Unauthorized" });
    try {
        const { config, network } = req.body;
        const address = await deployNFTPassServer(config, network);
        return res.json({ success: true, address });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Deployment Service (Async Worker) running on port ${PORT}`);
});
