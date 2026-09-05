/**
 * 🏛️ PLATFORM GOVERNANCE API: BILLING & GPU ACCOUNTING (F9.6)
 * apps/dashboard/src/app/api/v1/admin/billing/route.ts
 *
 * Handles administrative markup percentage overrides, manual balance adjustments,
 * and internal accounting queries protected by PlatformCapabilityRegistryService.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesTenantCredits, hermesComputeUsageEvents, hermesRunpodEndpoints } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformCapabilityRegistryService } from '@/lib/admin/platform-capability-registry.service';
import { PlatformActor, PlatformRole } from '@/lib/dash-contracts/admin';

export async function PATCH(req: NextRequest) {
  try {
    // 1. Resolve Platform Authority Server-Side
    const auth = await getNexusAuthContext(req.headers);

    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Platform Admin role required' }, { status: 403 });
    }

    const actor: PlatformActor = {
      id: auth.wallet || auth.email || 'admin_actor',
      actorType: auth.wallet ? 'WALLET' : 'MAGIC_LINK',
      role: auth.role as PlatformRole,
      walletAddress: auth.wallet || null,
      email: auth.email || null,
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
    };

    const body = await req.json();
    const { tenantId, markupPercentage, adjustmentUsd, isSandbox, reason } = body;

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'tenantId is required' }, { status: 400 });
    }

    const normalizedTenant = String(tenantId).toLowerCase().trim();

    // 2. Validate Capability
    if (markupPercentage !== undefined) {
      PlatformCapabilityRegistryService.requireCapability(actor, 'platform.tenants.markup.update', { tenantId: normalizedTenant });
    }

    if (adjustmentUsd && adjustmentUsd !== 0) {
      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        return NextResponse.json(
          { ok: false, error: 'Un motivo de auditoría explícito (mínimo 5 caracteres) es obligatorio para cualquier ajuste financiero en el servidor.' },
          { status: 400 }
        );
      }
      PlatformCapabilityRegistryService.requireCapability(actor, 'platform.credits.adjust', { tenantId: normalizedTenant });
    }

    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
    }

    // 3. Find or create tenant credits record
    const existing = await db
      .select()
      .from(hermesTenantCredits)
      .where(eq(hermesTenantCredits.tenantId, normalizedTenant))
      .limit(1);

    const record = existing[0];
    if (!record) {
      return NextResponse.json({ ok: false, error: `Tenant '${normalizedTenant}' not found in credit ledger` }, { status: 404 });
    }

    // 4. Calculate new balances
    const currentProdBalance = parseFloat(record.creditBalanceUsd || '0');
    const currentSandboxBalance = parseFloat(record.sandboxBalanceUsd || '0');
    const currentDeposited = parseFloat(record.totalDepositedUsd || '0');

    let newProdBalance = currentProdBalance;
    let newSandboxBalance = currentSandboxBalance;
    let newDeposited = currentDeposited;

    if (adjustmentUsd && adjustmentUsd !== 0) {
      if (isSandbox) {
        newSandboxBalance = Math.max(0, currentSandboxBalance + adjustmentUsd);
      } else {
        newProdBalance = Math.max(0, currentProdBalance + adjustmentUsd);
        if (adjustmentUsd > 0) {
          newDeposited += adjustmentUsd;
        }
      }
    }

    const newMarkup = markupPercentage !== undefined ? Number(markupPercentage) : record.markupPercentage;

    // 5. Update Neon DB
    await db
      .update(hermesTenantCredits)
      .set({
        creditBalanceUsd: newProdBalance.toFixed(4),
        sandboxBalanceUsd: newSandboxBalance.toFixed(4),
        totalDepositedUsd: newDeposited.toFixed(4),
        markupPercentage: newMarkup,
        updatedAt: new Date(),
      })
      .where(eq(hermesTenantCredits.tenantId, normalizedTenant));

    // 6. Register Audit Event in hermesComputeUsageEvents if adjustment occurred
    if (adjustmentUsd && adjustmentUsd !== 0) {
      await db.insert(hermesComputeUsageEvents).values({
        id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: normalizedTenant,
        capability: 'ADMIN_MANUAL_CREDIT_ADJUSTMENT',
        provider: 'pandoras_treasury',
        executionSeconds: '0.000',
        rawCostUsd: '0.00000',
        markupCostUsd: '0.00000',
        totalChargedUsd: adjustmentUsd.toFixed(5),
        isSandbox: !!isSandbox,
        status: 'SETTLED',
        metadataJson: {
          reason: reason || 'Manual Admin Adjustment',
          adminActor: actor.id,
          adminRole: actor.role,
          previousProdBalance: currentProdBalance,
          newProdBalance,
          previousSandboxBalance: currentSandboxBalance,
          newSandboxBalance,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      tenantId: normalizedTenant,
      creditBalanceUsd: newProdBalance,
      sandboxBalanceUsd: newSandboxBalance,
      markupPercentage: newMarkup,
    });
  } catch (err: any) {
    console.error('❌ [AdminBillingAPI] Error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
