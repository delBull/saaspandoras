import { NextResponse } from "next/server";
import { db } from "~/db";
import { daoRewards, userBalances } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const projectIdStr = searchParams.get("projectId");

  if (!address || !projectIdStr) {
    return NextResponse.json(
      { error: "address and projectId are required" },
      { status: 400 },
    );
  }

  const projectId = Number(projectIdStr);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  try {
    const pendingRewards = await db
      .select()
      .from(daoRewards)
      .where(
        and(
          eq(daoRewards.walletAddress, address.toLowerCase()),
          eq(daoRewards.projectId, projectId),
          isNull(daoRewards.claimedAt),
        ),
      );

    const totalPending = pendingRewards.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0,
    );

    const balance = await db.query.userBalances.findFirst({
      where: eq(userBalances.walletAddress, address.toLowerCase()),
      columns: { nonce: true, usdcBalance: true },
    });

    return NextResponse.json({
      rewards: pendingRewards,
      totalPending: totalPending.toFixed(6),
      count: pendingRewards.length,
      nonce: balance?.nonce ?? 0,
      usdcBalance: balance?.usdcBalance ?? "0",
    });
  } catch (error) {
    console.error("Rewards fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
