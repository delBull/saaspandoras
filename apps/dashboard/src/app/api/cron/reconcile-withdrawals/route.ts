import { NextResponse } from "next/server";
import { db } from "~/db";
import { withdrawals, userBalances, daoRewards } from "~/db/schema";
import { eq, and, lt, sql, isNotNull } from "drizzle-orm";
import { createPublicClient, http } from "viem";
import { sepolia, base } from "viem/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_THRESHOLD_MINUTES = 15;

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

async function unclaimDaoRewards(tx: any, withdrawalId: number) {
  await tx
    .update(daoRewards)
    .set({ claimedAt: null, txHash: null, claimBatchId: null })
    .where(and(
      eq(daoRewards.claimBatchId, withdrawalId),
      isNotNull(daoRewards.claimedAt),
    ));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    const staleWithdrawals = await db
      .select()
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.status, 'processing'),
          lt(withdrawals.createdAt, staleThreshold),
        ),
      );

    const results: { id: number; wallet: string; action: string }[] = [];

    for (const w of staleWithdrawals) {
      if (w.txHash) {
        const chain = getViemChain();
        const client = createPublicClient({ chain, transport: http() });

        try {
          const receipt = await client.getTransactionReceipt({ hash: w.txHash as `0x${string}` });

          if (receipt.status === 'success') {
            await db
              .update(withdrawals)
              .set({ status: 'completed', processedAt: new Date() })
              .where(eq(withdrawals.id, w.id));

            results.push({ id: w.id, wallet: w.walletAddress, action: 'completed_by_tx' });
          } else {
            await db.transaction(async (tx) => {
              await tx
                .update(userBalances)
                .set({
                  usdcBalance: sql`CAST(${userBalances.usdcBalance} + ${parseFloat(w.amount)} AS DECIMAL(18,6))`,
                })
                .where(eq(userBalances.walletAddress, w.walletAddress));

              await tx
                .update(withdrawals)
                .set({
                  status: 'failed',
                  error: 'Reconciled: tx reverted',
                  processedAt: new Date(),
                })
                .where(eq(withdrawals.id, w.id));

              await unclaimDaoRewards(tx, w.id);
            });

            results.push({ id: w.id, wallet: w.walletAddress, action: 'rolled_back_reverted' });
          }
        } catch {
          await db.transaction(async (tx) => {
            await tx
              .update(userBalances)
              .set({
                usdcBalance: sql`CAST(${userBalances.usdcBalance} + ${parseFloat(w.amount)} AS DECIMAL(18,6))`,
              })
              .where(eq(userBalances.walletAddress, w.walletAddress));

            await tx
              .update(withdrawals)
              .set({
                status: 'failed',
                error: 'Reconciled: tx not found (never mined or stale)',
                processedAt: new Date(),
              })
              .where(eq(withdrawals.id, w.id));

            await unclaimDaoRewards(tx, w.id);
          });

          results.push({ id: w.id, wallet: w.walletAddress, action: 'rolled_back_not_found' });
        }
      } else {
        await db.transaction(async (tx) => {
          await tx
            .update(userBalances)
            .set({
              usdcBalance: sql`CAST(${userBalances.usdcBalance} + ${parseFloat(w.amount)} AS DECIMAL(18,6))`,
            })
            .where(eq(userBalances.walletAddress, w.walletAddress));

          await tx
            .update(withdrawals)
            .set({
              status: 'failed',
              error: 'Reconciled: no tx hash (stale)',
              processedAt: new Date(),
            })
            .where(eq(withdrawals.id, w.id));

          await unclaimDaoRewards(tx, w.id);
        });

        results.push({ id: w.id, wallet: w.walletAddress, action: 'rolled_back_no_hash' });
      }
    }

    return NextResponse.json({
      reconciled: results.length,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/cron/reconcile-withdrawals]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
