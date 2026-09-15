import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusDeepLinks, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { getNexusAuthContext, checkNexusPermission } from '@/lib/nexus/nexus-rbac';
// Assuming we have domain adapters from Phase B to re-run the auth chain
import { DomainAdapter } from '../../operations/adapters/DomainAdapter';
import { TreasuryAdapter } from '../../operations/adapters/TreasuryAdapter';
import { HermesAdapter } from '../../operations/adapters/HermesAdapter';
import { GrowthAdapter } from '../../operations/adapters/GrowthAdapter';

export async function POST(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(req.headers);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const reference = body.reference;
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const referenceHash = crypto.createHash('sha256').update(reference).digest('hex');

    // Find the link
    const [link] = await db.query.nexusDeepLinks.findMany({
      where: eq(nexusDeepLinks.referenceHash, referenceHash),
      limit: 1,
    });

    if (!link) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    // TTL check
    if (new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: 'EXPIRED' }, { status: 410 });
    }

    // Single-use check
    if (link.consumedAt) {
      return NextResponse.json({ error: 'ALREADY_CONSUMED' }, { status: 410 });
    }

    // Cross-tenant boundary check (Deep link valid + wrong tenant = DENY)
    if (link.canonicalOrgId !== authCtx.canonicalOrgId && authCtx.role !== 'SUPER_ADMIN') {
      // Return 404 so we don't leak that the link belongs to someone else
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    // Mark as consumed
    await db.update(nexusDeepLinks)
      .set({
        consumedAt: new Date(),
        consumedByIdentityId: authCtx.collaboratorId?.toString() || 'system',
      })
      .where(eq(nexusDeepLinks.id, link.id));

    // Re-run Authorization Chain for the Operation
    let targetOperation: any = null;

    if (link.targetType === 'hitl_intervention') {
      if (!checkNexusPermission(authCtx, 'nexus.manage')) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 });
      }
      const adapter = new HermesAdapter();
      const items = await adapter.getOperations(authCtx);
      targetOperation = items.find((op: any) => op.id === link.targetId);
    } 
    else if (link.targetType === 'action_request') {
      if (!checkNexusPermission(authCtx, 'finance.manage')) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 });
      }
      const adapter = new TreasuryAdapter();
      const items = await adapter.getOperations(authCtx);
      targetOperation = items.find((op: any) => op.id === link.targetId || op.payload?.actionRequestId === link.targetId);
    }
    else {
      // Unhandled target type
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (!targetOperation) {
      // Operation might have been deleted, already completed, or wrong resource scope
      return NextResponse.json({ error: 'GONE' }, { status: 410 });
    }

    return NextResponse.json({ operation: targetOperation });

  } catch (error: any) {
    console.error('[DeepLinkResolve] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
