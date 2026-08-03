import { NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { db } from '@/db';
import { installedProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, installedProductId, config } = body;

    if (!sessionToken || !installedProductId || !config) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session || session.installedProductId !== installedProductId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentProduct = await db.query.installedProducts.findFirst({
      where: eq(installedProducts.id, installedProductId),
      columns: { config: true },
    });

    const currentConfig = (currentProduct?.config as Record<string, any>) || {};
    const updatedConfig = { ...currentConfig, ...config };

    await db.update(installedProducts)
      .set({ config: updatedConfig, updatedAt: new Date() })
      .where(eq(installedProducts.id, installedProductId));

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update config' }, { status: 500 });
  }
}
