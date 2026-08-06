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

    // Mock capability resolution based on DB capabilities
    const caps = hermes.capabilities as any || {};
    return NextResponse.json([
        { id: 'language.generate', status: caps.language ? 'ACTIVE' : 'INACTIVE', provider: 'Ollama' },
        { id: 'security.authorize', status: 'ACTIVE', provider: 'Kernel' },
        { id: 'routing.navigate', status: 'ACTIVE', provider: 'Kernel' }
    ]);
}
