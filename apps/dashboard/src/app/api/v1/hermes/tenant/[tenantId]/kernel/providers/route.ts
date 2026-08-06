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
