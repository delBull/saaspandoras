import { NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, installedProductId, config, connectors } = body;

    if (!sessionToken || !installedProductId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session || session.installedProductId !== installedProductId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentProduct = await db.query.installedProducts.findFirst({
      where: eq(installedProducts.id, installedProductId),
      columns: { config: true, connectors: true },
    });

    const updatePayload: Record<string, any> = { updatedAt: new Date() };

    if (config) {
      const currentConfig = (currentProduct?.config as Record<string, any>) || {};
      updatePayload.config = { ...currentConfig, ...config };
    }

    if (connectors) {
      const currentConnectors = (currentProduct?.connectors as Record<string, any>) || {};
      updatePayload.connectors = { ...currentConnectors, ...connectors };
    }

    await db.update(installedProducts)
      .set(updatePayload)
      .where(eq(installedProducts.id, installedProductId));

    return NextResponse.json({ success: true, updatedPayload: updatePayload });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update configuration or connectors' }, { status: 500 });
  }
}
