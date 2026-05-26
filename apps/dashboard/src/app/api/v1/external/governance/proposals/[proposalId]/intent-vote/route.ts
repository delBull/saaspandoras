import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { intentVotes, governanceProposals } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * PUT /api/v1/external/governance/proposals/[proposalId]/intent-vote
 * 
 * Social/Intent voting for governance proposals (pre-on-chain).
 * This is a "cam lower" style voting that collects user sentiment before on-chain.
 * 
 * Request body:
 *   support: 1=For, 0=Against, 2=Abstain
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    const { client, error } = await validateExternalKey(req, "write:governance");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { proposalId } = await params;
    const url = new URL(req.url);
    const protocolId = url.searchParams.get("protocolId");
    
    try {
        // Check if proposal exists and belongs to protocol if specified
        let whereClause = eq(governanceProposals.proposalId, proposalId);
        
        if (protocolId) {
            const parsedProtocolId = parseInt(protocolId);
            if (!isNaN(parsedProtocolId)) {
                whereClause = and(whereClause, eq(governanceProposals.protocolId, parsedProtocolId)) as any;
            }
        }

        const proposal = await db.query.governanceProposals.findFirst({
            where: whereClause,
            columns: { id: true, protocolId: true,proposalId: true }
        });

        if (!proposal) {
            return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
        }

        // Parse request body
        const body = await req.json();
        const { support, reason } = body;

        // Resolve voter address from body or headers
        const voterAddressRaw = body.voterAddress || body.walletAddress || body.voter || req.headers.get("x-wallet-address");
        if (!voterAddressRaw) {
            return NextResponse.json({ error: "Missing 'voterAddress' in body or 'x-wallet-address' header" }, { status: 400 });
        }
        
        const voterAddress = voterAddressRaw.toLowerCase();
        if (voterAddress.length !== 42 || !voterAddress.startsWith("0x")) {
            return NextResponse.json({ error: "Invalid 'voterAddress'. Must be a valid 42-character Ethereum address starting with 0x." }, { status: 400 });
        }

        // Validate support value
        if (support === undefined || [0, 1, 2].indexOf(support) === -1) {
            return NextResponse.json({ error: "Invalid 'support' value. Must be: 0=Against, 1=For, 2=Abstain" }, { status: 400 });
        }

        console.log(`[intent-vote] Proposal ${proposalId}, voter=${voterAddress}, support=${support}, protocol=${proposal.protocolId}`);

        // Create or update intent vote
        const vote = await db.insert(intentVotes).values({
            proposalId: proposal.proposalId,
            voterAddress,
            support,
            reason: reason || null,
        }).onConflictDoUpdate({
            target: [intentVotes.proposalId, intentVotes.voterAddress],
            set: {
                support,
                reason: reason || null,
            },
        }).returning();

        return NextResponse.json({
            success: true,
            vote: vote[0]
        });

    } catch (e: any) {
        console.error("[external:governance:intent-vote] Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
