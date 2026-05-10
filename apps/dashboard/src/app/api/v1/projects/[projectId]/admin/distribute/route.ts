import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { daoMembers, userBalances, projects, daoActivities } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = parseInt(params.projectId);
  const walletAddress = req.headers.get("x-wallet-address");

  if (!walletAddress) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 401 });
  }

  try {
    const { amount, description } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Verify Ownership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
       // In a real production app, we would also verify a signature or session
       return NextResponse.json({ error: "Unauthorized. Only project owner can distribute rewards." }, { status: 403 });
    }

    // 2. Fetch Holders & Total Voting Power
    const holders = await db.query.daoMembers.findMany({
      where: eq(daoMembers.projectId, projectId),
    });

    if (holders.length === 0) {
      return NextResponse.json({ error: "No holders found for this project." }, { status: 400 });
    }

    const totalVP = holders.reduce((acc, h) => acc + Number(h.votingPower || 0), 0);

    if (totalVP <= 0) {
      return NextResponse.json({ error: "Total voting power is zero. Cannot distribute." }, { status: 400 });
    }

    // 3. Batch Update Balances (Simulated via loop for simplicity, in high-scale use a bulk SQL update)
    const updates = holders.map(async (holder) => {
      const share = (Number(holder.votingPower) / totalVP) * amount;
      
      // Upsert user balance
      return db.insert(userBalances)
        .values({
          walletAddress: holder.wallet.toLowerCase(),
          usdcBalance: share.toString(),
          pboxBalance: "0",
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [userBalances.walletAddress],
          set: {
            usdcBalance: sql`${userBalances.usdcBalance} + ${share.toString()}`,
            updatedAt: new Date()
          }
        });
    });

    await Promise.all(updates);

    // 4. Log Activity
    await db.insert(daoActivities).values({
      projectId: projectId,
      title: "Distribución de Utilidades",
      description: description || `Distribución pro-rata de ${amount} USDC entre holders.`,
      rewardAmount: amount.toString(),
      rewardTokenSymbol: "USDC",
      type: "payout" as any,
      category: "governance",
      status: "active",
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully distributed ${amount} USDC to ${holders.length} holders.` 
    });

  } catch (error: any) {
    console.error("[Distribute API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}
