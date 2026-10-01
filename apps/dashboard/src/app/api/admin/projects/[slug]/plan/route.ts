import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAuditLedgerService } from '@/lib/admin/platform-audit-ledger.service';
import { sendTenantProvisionEmail } from '@/lib/email/tenant-provision-mailer';

export const dynamic = 'force-dynamic';

/** Commercial enum used across the platform (installed_products.plan). */
const VALID_PLANS = ['sandbox', 'starter', 'growth', 'enterprise'] as const;
const VALID_STATUSES = ['trial', 'active', 'suspended', 'churned'] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const body = await req.json();
    const { plan, status, productFamily } = body;

    if (!plan || !(VALID_PLANS as readonly string[]).includes(plan)) {
      return NextResponse.json({
        success: false,
        message: `Plan must be one of: ${VALID_PLANS.join(', ')}`,
      }, { status: 400 });
    }
    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      }, { status: 400 });
    }

    const [project] = await db.select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
    }).from(projects).where(eq(projects.slug, slug)).limit(1);
    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    // Optional targeting: update only one vertical (productFamily), or all
    // installed products of the tenant when omitted.
    const whereClause = productFamily
      ? and(
          eq(installedProducts.projectId, project.id),
          eq(installedProducts.productFamily, productFamily)
        )
      : eq(installedProducts.projectId, project.id);

    const updatedRows = await db.update(installedProducts)
      .set({ plan, status: status || 'active' })
      .where(whereClause)
      .returning({ id: installedProducts.id, productFamily: installedProducts.productFamily });

    PlatformAuditLedgerService.recordEntry({
      actorId: auth.wallet || 'platform_admin',
      actorWallet: auth.wallet || 'unknown',
      actorRole: auth.role || 'ADMIN',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: slug,
      capability: 'billing.plan.manage',
      governance: {
        isDiscord2faVerified: false,
        auditReason: `Plan → ${plan}${status ? `/${status}` : ''}${productFamily ? ` [${productFamily}]` : ''}`,
      },
      stateTransition: {
        previousState: null,
        newState: { plan, status: status || 'active', productFamily: productFamily || 'ALL' },
      },
      result: 'SUCCESS',
    });

    const adminEmail = auth.email || 'marco@pandoras.finance';
    await sendTenantProvisionEmail(adminEmail, project.title, plan, {
        action: 'PLAN_UPGRADE',
        productFamily: productFamily || undefined,
        requestedBy: (auth as any).wallet || 'platform_admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      updatedProducts: updatedRows,
    });
  } catch (error: any) {
    console.error('[Admin API: update plan]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
