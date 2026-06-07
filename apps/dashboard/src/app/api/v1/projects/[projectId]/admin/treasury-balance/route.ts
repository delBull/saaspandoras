import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;

    if (!walletAddress) {
        return NextResponse.json({ error: "Missing or invalid session" }, { status: 401 });
    }

    try {
        const projectIdNum = parseInt(projectId);
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectIdNum),
        });

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const treasuryAddress = project.treasuryAddress || project.applicantWalletAddress;

        return NextResponse.json({
            balance: "0.00",
            treasuryAddress,
            note: "On-chain balance fetch requires RPC call. Set PANDORAS_RPC_URL for live balance."
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

export const GET = withSecurity(handler as any, { rateLimit: apiRateLimiter });
