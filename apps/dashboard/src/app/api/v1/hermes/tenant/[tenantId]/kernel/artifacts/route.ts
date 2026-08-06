import { NextResponse } from 'next/server';
import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    const [hermes] = await db.select()
        .from(installedProducts)
        .where(and(
            eq(installedProducts.projectId, Number(tenantId)),
            eq(installedProducts.product, 'HERMES')
        ));

    if (!hermes) {
        return NextResponse.json({ error: 'Hermes Kernel not provisioned' }, { status: 404 });
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
