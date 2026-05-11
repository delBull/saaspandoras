import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    const walletAddress = req.headers.get("x-wallet-address");

    if (!walletAddress) {
        return NextResponse.json({ error: "Missing wallet address" }, { status: 401 });
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