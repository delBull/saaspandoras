import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadorCommissions, ambassadors, projects } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyMessage } from 'viem';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { executeControllerWithdraw } from '@/lib/treasury/allowance';
import { withSecurity, withdrawRateLimiter, isValidWalletAddress } from '@/lib/security-utils';

async function handler(req: Request) {
    const authHeaders = await headers();
    const { session } = await getAuth(authHeaders);
    if (!session?.address) {
        return NextResponse.json({ error: 'Unauthorized — session required' }, { status: 401 });
    }

    const body = await req.json();
    const { walletSignature, message } = body;

    if (!walletSignature || !message) {
        return NextResponse.json({ error: 'Missing walletSignature or message' }, { status: 400 });
    }

    const walletLower = session.address.toLowerCase();

    // 1. Find ambassador by wallet
    const ambassador = await db.query.ambassadors.findFirst({
        where: eq(ambassadors.walletAddress, walletLower)
    });

    if (!ambassador) {
        return NextResponse.json({ error: 'No ambassador found for this wallet' }, { status: 404 });
    }

    if (ambassador.status !== 'active') {
        return NextResponse.json({ error: 'Ambassador is not active' }, { status: 403 });
    }

    // 2. Verify message signature
    const expectedMessage = `Claim ambassador commissions | ${ambassador.referralCode}`;
    if (message !== expectedMessage) {
        return NextResponse.json({ error: 'Signed message does not match expected format' }, { status: 400 });
    }

    const isValid = await verifyMessage({
        address: session.address as `0x${string}`,
        message,
        signature: walletSignature as `0x${string}`,
    });

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Get pending commissions
    const pending = await db.query.ambassadorCommissions.findMany({
        where: and(
            eq(ambassadorCommissions.ambassadorId, ambassador.id),
            eq(ambassadorCommissions.status, 'pending')
        ),
    });

    if (pending.length === 0) {
        return NextResponse.json({ error: 'No pending commissions to withdraw' }, { status: 400 });
    }

    const totalUsdc = pending.reduce((sum, c) => sum + parseFloat(c.amountUsdc || '0'), 0);
    const totalUsdcStr = totalUsdc.toFixed(6);

    // 4. Execute on-chain transfer via AllowanceController (admin wallet as delegate)
    const exec = await executeControllerWithdraw(walletLower, totalUsdcStr);

    if (!exec.ok) {
        return NextResponse.json({ error: `Withdraw failed: ${exec.error}` }, { status: 500 });
    }

    // 5. Mark commissions as paid (atomic update inside transaction)
    const pendingIds = pending.map(c => c.id);
    await db.transaction(async (tx) => {
        await tx.update(ambassadorCommissions)
            .set({
                status: 'paid',
                paidAt: new Date(),
            })
            .where(
                and(
                    eq(ambassadorCommissions.ambassadorId, ambassador.id),
                    eq(ambassadorCommissions.status, 'pending')
                )
            );
    });

    return NextResponse.json({
        success: true,
        amount: totalUsdcStr,
        commissionsClaimed: pending.length,
        txHash: exec.txHash,
    });
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
