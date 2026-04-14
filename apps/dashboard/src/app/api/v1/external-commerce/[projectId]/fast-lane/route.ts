import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await req.json();
    const { email, amount, tier, source, wallet_connected } = body;
    const projectIdNum = parseInt(params.projectId, 10);

    if (!email || isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Email y proyecto son requeridos' }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectIdNum)
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const safeAmount = parseInt(amount, 10) || 1;
    const isWhale = safeAmount >= 5;
    
    // Create the lead using db.insert
    const { IdentityService } = await import("@/lib/marketing/identity-service");
    const identityHash = IdentityService.getIdentityHash(email.toLowerCase(), null, null);
    
    await db.insert(marketingLeads).values({
        projectId: projectIdNum,
        email: email.toLowerCase(),
        walletAddress: null,
        identityHash: identityHash as string,
        status: 'active',
        intent: 'invest',
        score: isWhale ? 98 : 75,
        origin: 'Fastlane Checkout Hub',
        metadata: {
           tierTarget: tier,
           amountTarget: safeAmount,
           fastLane: true,
           requiresManualClosing: true,
           source: source || 'checkout_hub',
           walletConnected: wallet_connected || false,
           intentTimestamp: new Date().toISOString()
        },
        consent: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fast-lane capture error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
