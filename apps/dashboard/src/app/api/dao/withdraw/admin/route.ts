import { NextResponse } from "next/server";
import { db } from "~/db";
import { daoMembers, userBalances, projects, distributionBatches, daoRewards } from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { createPublicClient, http, verifyMessage } from "viem";
import { sepolia, base } from "viem/chains";
import { getAuth } from "~/lib/auth";
import { headers } from "next/headers";
import { withSecurity, distributeRateLimiter } from "~/lib/security-utils";
import { getAdminAddress } from "~/lib/treasury/withdraw";
import { getControllerAddress } from "~/lib/treasury/allowance";
import { getUsdcAddress } from "~/lib/treasury/usdc-contract";

async function handler(request: Request): Promise<Response> {
  // 1. Admin auth via session
  const authHeaders = await headers();
  const { session } = await getAuth(authHeaders);
  if (!session?.address) {
    return NextResponse.json({ error: "Unauthorized — session required" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, walletSignature, message } = body;

  if (!projectId || !walletSignature || !message) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, walletSignature, message" },
      { status: 400 },
    );
  }

  // 2. Verify project ownership
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.applicantWalletAddress?.toLowerCase() !== session.address.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden — not the project owner" }, { status: 403 });
  }

  // 3. Verify deterministic message
  const adminAddress = getAdminAddress();
  const expectedMessage = `Bulk distribute USDC | Project ${projectId} | Admin ${adminAddress}`;

  if (message !== expectedMessage) {
    return NextResponse.json(
      { error: "Signed message does not match expected format for bulk distribution" },
      { status: 400 },
    );
  }

  const isValid = await verifyMessage({
    address: session.address as `0x${string}`,
    message,
    signature: walletSignature as `0x${string}`,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 4. Get all DAO holders with voting power > 0
  const holders = await db.query.daoMembers.findMany({
    where: eq(daoMembers.projectId, projectId),
  });

  if (holders.length === 0) {
    return NextResponse.json({ error: "No DAO holders found for this project" }, { status: 400 });
  }

  // 5. Calculate total voting power and pro-rata allocations
  const totalVotingPower = holders.reduce((sum, h) => sum + Number(h.votingPower), 0);
  if (totalVotingPower <= 0) {
    return NextResponse.json({ error: "Total voting power is zero" }, { status: 400 });
  }

  // Check controller has enough balance (per-project or global)
  const controllerAddr = (project.allowanceControllerAddress || getControllerAddress()) as `0x${string}`;
  const viemChain = process.env.NODE_ENV === 'production' ? base : sepolia;
  const publicClient = createPublicClient({ chain: viemChain, transport: http() });
  const usdcAddress = getUsdcAddress();

  const controllerRawBalance = await publicClient.readContract({
    address: usdcAddress,
    abi: [{ type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "balanceOf",
    args: [controllerAddr],
  });

  const totalUsdcWei = controllerRawBalance as bigint;
  const totalUsdcNum = Number(totalUsdcWei) / 1_000_000;

  if (totalUsdcNum <= 0) {
    return NextResponse.json({
      error: "Controller balance is zero. Transfer USDC to the AllowanceController before distributing.",
    }, { status: 400 });
  }

  // 6. Insert dao_rewards for each holder (no on-chain transfer — users claim via AllowanceController)
  const rewards = [];
  let totalDistributed = 0;

  for (const holder of holders) {
    const share = Number(holder.votingPower) / totalVotingPower;
    const holderAmount = (totalUsdcNum * share).toFixed(6);

    if (parseFloat(holderAmount) <= 0) continue;

    rewards.push({
      projectId,
      walletAddress: holder.wallet.toLowerCase(),
      amount: holderAmount,
      token: 'USDC',
      reason: 'profit_sharing',
    });

    totalDistributed += parseFloat(holderAmount);
  }

  // Batch insert all rewards
  if (rewards.length > 0) {
    await db.insert(daoRewards).values(rewards);
  }

  // Update user_balances for each holder
  const now = new Date();
  for (const r of rewards) {
    // Upsert: if no balance row exists, create one
    const existing = await db.query.userBalances.findFirst({
      where: eq(userBalances.walletAddress, r.walletAddress),
    });

    if (existing) {
      await db
        .update(userBalances)
        .set({
          usdcBalance: sql`CAST(${userBalances.usdcBalance} + ${parseFloat(r.amount)} AS DECIMAL(18,6))`,
        })
        .where(eq(userBalances.walletAddress, r.walletAddress));
    } else {
      await db.insert(userBalances).values({
        walletAddress: r.walletAddress,
        usdcBalance: r.amount,
        nonce: 0,
      });
    }
  }

  // Log distribution batch
  await db.insert(distributionBatches).values({
    projectId,
    totalAmount: totalDistributed.toFixed(6),
    totalHolders: rewards.length,
    currency: 'USDC',
    status: 'completed',
    executedBy: session.address.toLowerCase(),
    batchMetadata: { rewards, method: 'dao_rewards' },
    completedAt: now,
  });

  return NextResponse.json({
    success: true,
    status: 'completed',
    totalDistributed: totalDistributed.toFixed(6),
    holdersProcessed: rewards.length,
    method: 'dao_rewards',
    message: `Claimable rewards created for ${rewards.length} holders. Users can claim via AllowanceController.`,
  });
}

export const POST = withSecurity(handler, { rateLimit: distributeRateLimiter });
