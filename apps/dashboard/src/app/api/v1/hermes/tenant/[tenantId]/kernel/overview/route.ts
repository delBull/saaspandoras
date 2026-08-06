import { NextResponse } from 'next/server';
import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    // Fetch tenant's hermes product installation
    const [hermes] = await db.select()
        .from(installedProducts)
        .where(and(
            eq(installedProducts.projectId, Number(tenantId)),
            eq(installedProducts.product, 'HERMES')
        ));

    if (!hermes) {
        return NextResponse.json({ error: 'Hermes Kernel not provisioned for this tenant' }, { status: 404 });
    }

    // Mock Overview using DB data as base
    return NextResponse.json({
        tenantId: hermes.projectId,
        health: hermes.status === 'active' || hermes.status === 'trial' ? 'HEALTHY' : 'SUSPENDED',
        telemetrySnapshot: {
            activeSessions: 0,
            pendingEvents: 0
        },
        bindingMode: hermes.bindingMode,
        packId: hermes.packId
    });
}
