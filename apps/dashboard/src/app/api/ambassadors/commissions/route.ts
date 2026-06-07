import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadorCommissions, ambassadors } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: Request) {
    try {
        const authHeaders = await headers();
        const { session } = await getAuth(authHeaders);
        if (!session?.address) {
            return NextResponse.json({ error: 'Unauthorized — session required' }, { status: 401 });
        }

        const walletLower = session.address.toLowerCase();

        // Find ambassador by wallet
        const ambassador = await db.query.ambassadors.findFirst({
            where: eq(ambassadors.walletAddress, walletLower)
        });

        if (!ambassador) {
            return NextResponse.json({ error: 'No ambassador found for this wallet' }, { status: 404 });
        }

        // Get pending commissions
        const pending = await db.query.ambassadorCommissions.findMany({
            where: and(
                eq(ambassadorCommissions.ambassadorId, ambassador.id),
                eq(ambassadorCommissions.status, 'pending')
            ),
            orderBy: (comms, { desc }) => [desc(comms.createdAt)],
        });

        // Get paid commissions
        const paid = await db.query.ambassadorCommissions.findMany({
            where: and(
                eq(ambassadorCommissions.ambassadorId, ambassador.id),
                eq(ambassadorCommissions.status, 'paid')
            ),
            orderBy: (comms, { desc }) => [desc(comms.createdAt)],
        });

        // Aggregate totals
        const pendingTotal = pending.reduce((sum, c) => sum + parseFloat(c.amountUsdc || '0'), 0);
        const paidTotal = paid.reduce((sum, c) => sum + parseFloat(c.amountUsdc || '0'), 0);
        const clientCount = new Set(pending.concat(paid).map(c => c.clientWallet)).size;

        // Count by type
        const directSales = pending.filter(c => c.type === 'DIRECT_SALE_4').length;
        const residualYield = pending.filter(c => c.type === 'RESIDUAL_YIELD_1').length;

        return NextResponse.json({
            referralCode: ambassador.referralCode,
            status: ambassador.status,
            pending: {
                total: pendingTotal.toFixed(2),
                count: pending.length,
                directSales,
                residualYield,
                commissions: pending.map(c => ({
                    id: c.id,
                    amount: c.amountUsdc,
                    type: c.type,
                    clientWallet: c.clientWallet,
                    createdAt: c.createdAt,
                })),
            },
            paid: {
                total: paidTotal.toFixed(2),
                count: paid.length,
                commissions: paid.map(c => ({
                    id: c.id,
                    amount: c.amountUsdc,
                    type: c.type,
                    clientWallet: c.clientWallet,
                    paidAt: c.paidAt,
                })),
            },
            totalClients: clientCount,
        });
    } catch (error) {
        console.error('[Ambassador Commissions API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
