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
        console.warn(`[Capabilities API] Hermes Kernel not provisioned in DB for tenant ${tenantIdNum}, using virtual provisioning fallback.`);
        hermes = { product: 'HERMES', status: 'active', projectId: tenantIdNum, capabilities: {} };
    }

    // Mock capability resolution based on DB capabilities
    const caps = hermes.capabilities as any || {};
    return NextResponse.json([
        { id: 'language.generate', status: caps.language ? 'ACTIVE' : 'INACTIVE', provider: 'Ollama' },
        { id: 'security.authorize', status: 'ACTIVE', provider: 'Kernel' },
        { id: 'routing.navigate', status: 'ACTIVE', provider: 'Kernel' }
    ]);
}
