import { NextResponse } from 'next/server';
import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const tenantIdNum = Number(tenantId);

    const [hermesDb] = await db.select()
        .from(installedProducts)
        .where(and(
            eq(installedProducts.projectId, tenantIdNum),
            eq(installedProducts.product, 'HERMES')
        ));

    let hermes: any = hermesDb;
    if (!hermesDb) {
        console.warn(`[Artifacts API] Hermes Kernel not provisioned in DB for tenant ${tenantIdNum}, using virtual provisioning fallback.`);
        hermes = { product: 'HERMES', status: 'active', projectId: tenantIdNum, config: {} };
    }

    const manifest = hermes.runtimeManifest as any || {};

    return NextResponse.json({
        storeId: `store_${tenantId}`,
        compiledArtifacts: manifest.artifacts || [
            { type: 'Discovery', status: 'COMPILED', version: 'v1.0' },
            { type: 'Knowledge', status: 'COMPILED', version: 'v1.0' },
            { type: 'Workflow', status: 'PENDING', version: 'v1.0' }
        ]
    });
}
