import { NextResponse } from 'next/server';
import { ProvisioningEngine } from '@/lib/platform/provisioning-engine';
import { ProductKey, PlanKey } from '@/lib/platform/product-registry';
import { validateAdminSession } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const auth = await validateAdminSession(request.headers);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const { leadId, product, plan = 'sandbox', trialDays = 14, existingProjectId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    if (!product) {
      return NextResponse.json({ error: 'product is required' }, { status: 400 });
    }

    const result = await ProvisioningEngine.provision({
      leadId,
      product: product as ProductKey,
      plan: plan as PlanKey,
      trialDays: Number(trialDays) || 14,
      existingProjectId: existingProjectId ? Number(existingProjectId) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Provisioning Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Provisioning failed' },
      { status: 500 }
    );
  }
}
