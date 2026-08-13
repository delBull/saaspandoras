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
        console.warn(`[Providers API] Hermes Kernel not provisioned in DB for tenant ${tenantIdNum}, using virtual provisioning fallback.`);
        hermes = { product: 'HERMES', status: 'active', projectId: tenantIdNum, connectors: {} };
    }

    const connectors = hermes.connectors as any || {};

    return NextResponse.json({
        decisionProviders: [
            { id: 'ollama_local', status: 'ACTIVE', model: 'llama-3.1' }
        ],
        executionProviders: [
            { id: 'kernel_executor', status: 'ACTIVE' }
        ],
        capabilityProviders: [
            { id: 'telegram_bot', status: connectors.telegram?.botToken ? 'ACTIVE' : 'INACTIVE' }
        ],
        connectors: {
            telegram: connectors.telegram ? { botToken: '***' } : null
        }
    });
}
