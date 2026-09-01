import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';
import { getTreasuryBalances } from '@/lib/growth/treasury-onchain';

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

        const treasury = await getTreasuryBalances(project);

        return NextResponse.json({
            balance: treasury ? treasury.balanceUsdc.toFixed(2) : "0.00",
            treasuryAddress: treasury?.treasuryAddress || project.treasuryAddress || project.applicantWalletAddress,
            smartAccountAddress: treasury?.smartAccountAddress || null,
            nativeBalance: treasury?.balanceNative ?? 0,
            nativeSymbol: treasury?.nativeSymbol || "ETH",
            usdcBalance: treasury?.balanceUsdc ?? 0,
            usdcSymbol: treasury?.usdcSymbol || "USDC",
            chainId: treasury?.chainId ?? project.chainId ?? null,
            source: treasury?.source || "fallback",
            note: treasury?.source === "onchain"
                ? "Live on-chain balance."
                : "On-chain balance unavailable (no treasury address or RPC).",
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

export const GET = withSecurity(handler as any, { rateLimit: apiRateLimiter });
