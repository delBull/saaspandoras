import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { installedProducts } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const tenantIdNum = Number(tenantId);

    // Fetch tenant's hermes product installation
    const [hermesDb] = await db.select()
        .from(installedProducts)
        .where(and(
            eq(installedProducts.projectId, tenantIdNum),
            eq(installedProducts.product, 'HERMES')
        ));

    let hermes: any = hermesDb;
    if (!hermesDb) {
        console.warn(`[Overview API] Hermes Kernel not provisioned in DB for tenant ${tenantIdNum}, using virtual provisioning fallback.`);
        hermes = { product: 'HERMES', status: 'active', projectId: tenantIdNum, config: {} };
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
