import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@saasfly/db-core';
import { commercialOrders, commercialOrderLines, projects } from '@saasfly/db-core/schema';
import { TenantProvisioningService, ProvisioningRequestDTO } from '@saasfly/shared';
import * as jose from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;

    // Validate commercial session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('commercial_session')?.value;
    
    if (!sessionToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    if (!process.env.PANDORAS_SECRET_KEY) {
      return new NextResponse('Internal Server Error: Missing Secret', { status: 500 });
    }
    const secret = new TextEncoder().encode(process.env.PANDORAS_SECRET_KEY);
    const { payload } = await jose.jwtVerify(sessionToken, secret);
    
    if (!payload.scope || typeof payload.scope !== 'string' || !payload.scope.includes('commercial:order_create') || !payload.leadId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return new NextResponse('Missing wallet address', { status: 400 });
    }

    const leadId = payload.leadId as string;

    // Load the order
    const [order] = await db
      .select()
      .from(commercialOrders)
      .where(eq(commercialOrders.id, orderId))
      .limit(1);

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (order.leadId !== leadId) {
      return new NextResponse('Unauthorized to provision this order', { status: 403 });
    }

    if (order.status !== 'PAID' && order.status !== 'PROVISIONING') {
      return new NextResponse(
        `Payment required. Order must be settled (status: PAID) before provisioning. Current status: ${order.status}`,
        { status: 402 }
      );
    }

    // Fail-closed against $0 or unsettled bypass
    if (Number(order.totalAmount) <= 0) {
      return new NextResponse('Invalid order total: zero-cost auto-provisioning is strictly prohibited.', { status: 400 });
    }

    // Bridge: Move PAID order into PROVISIONING state
    if (order.status === 'PAID') {
      await db
        .update(commercialOrders)
        .set({
          status: 'PROVISIONING',
          updatedAt: new Date(),
        })
        .where(eq(commercialOrders.id, orderId));
    }

    // Load lines to reconstruct products
    const orderLines = await db
      .select()
      .from(commercialOrderLines)
      .where(eq(commercialOrderLines.orderId, orderId));

    const productsToInstall = orderLines.map(l => l.productKey as any);
    const intents = orderLines[0]?.metadata || {};

    const provisionReq: ProvisioningRequestDTO = {
      organization: {
        name: order.requestedOrgName,
        slug: order.requestedOrgSlug,
      },
      products: productsToInstall,
      intents,
      idempotencyKey: `auto_prov_${orderId}`,
    };

    // Auto-provision
    const provisionService = new TenantProvisioningService();
    const result = await provisionService.provisionTenant(provisionReq, walletAddress);

    if (result.success) {
      // Find the project ID
      const [project] = await db
        .select({ id: projects.id, slug: projects.slug })
        .from(projects)
        .where(eq(projects.slug, result.organizationSlug))
        .limit(1);

      if (project) {
        // P0-3: Wire ProvisioningEngine so the tenant receives full Hermes runtime & channels
        try {
          const { ProvisioningEngine } = await import('@/lib/platform/provisioning-engine');
          const primaryProduct = productsToInstall[0] || 'GROWTH_OS';
          await ProvisioningEngine.provision({
            leadId: order.leadId,
            product: primaryProduct as any,
            plan: 'growth',
            existingProjectId: project.id,
          });
        } catch (engineErr: any) {
          console.warn('[Provisioning] ProvisioningEngine non-blocking warning:', engineErr?.message || engineErr);
        }
      }

      await db
        .update(commercialOrders)
        .set({
          status: 'PROVISIONED',
          verifiedBy: walletAddress,
          verifiedAt: new Date(),
          provisionedProjectId: project?.id,
          updatedAt: new Date(),
        })
        .where(eq(commercialOrders.id, orderId));
      
      // 🛰️ Publish tenant provisioned to Hermes Event Bus (Batch D)
      try {
        const { HermesEventBus } = await import('@saasfly/hermes-core');
        await HermesEventBus.emit(
          'TenantProvisioned',
          Number(project?.id) || 0,
          'pandoras_commerce',
          {
            orderId,
            organizationSlug: result.organizationSlug,
            leadId: order.leadId,
            walletAddress,
          }
        );
      } catch (busErr) {
        console.error('[Provisioning] HermesEventBus publish failed (non-blocking):', busErr);
      }

      return NextResponse.json({ success: true, organizationSlug: result.organizationSlug });
    } else {
      return new NextResponse('Provisioning failed', { status: 500 });
    }

  } catch (error: any) {
    console.error('[Provisioning] Error:', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
