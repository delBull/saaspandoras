import { NextResponse } from "next/server";
import { db } from "@/db";
import { deploymentJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params;

    try {
        const headersObj = await headers();
        const { session } = await getAuth(headersObj);

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const job = await db.query.deploymentJobs.findFirst({
            where: eq(deploymentJobs.id, Number(jobId))
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                step: job.step,
                error: job.error,
                result: job.result,
                updatedAt: job.updatedAt
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
