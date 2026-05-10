import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects, purchases, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { email, name, phone, amount, tier, source, wallet_connected, confirmIntent } = body;
    const projectIdNum = parseInt(projectId, 10);

    if (!email || isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Email y proyecto son requeridos' }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectIdNum)
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const safeAmount = parseInt(amount, 10);
    if (!safeAmount || safeAmount <= 0) {
      return NextResponse.json({ error: 'Monto de inversión inválido o no proporcionado' }, { status: 400 });
    }
    
    const isWhale = safeAmount >= 500;
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Identity & Lead Management
    const { IdentityService } = await import("@/lib/marketing/identity-service");
    const identityHash = IdentityService.getIdentityHash(normalizedEmail, null, null);
    
    const insertValues = {
        projectId: projectIdNum,
        email: normalizedEmail,
        name: name || null,
        phoneNumber: phone || null,
        identityHash: identityHash as string,
        status: (confirmIntent ? 'on_hold' : 'active') as any,
        intent: 'invest' as const,
        score: isWhale ? 98 : 75,
        origin: 'Fastlane Checkout Hub',
        metadata: {
           tierTarget: tier,
           amountTarget: safeAmount,
           fastLane: true,
           requiresManualClosing: true,
           source: source || 'checkout_hub',
           walletConnected: wallet_connected || false,
           intentTimestamp: new Date().toISOString(),
           isConfirmedIntent: !!confirmIntent
        },
        consent: true
    };

    const [lead] = await db.insert(marketingLeads)
        .values(insertValues)
        .onConflictDoUpdate({
            target: [marketingLeads.projectId, marketingLeads.identityHash],
            set: {
                name: name || undefined,
                phoneNumber: phone || undefined,
                status: insertValues.status,
                metadata: insertValues.metadata,
                updatedAt: new Date()
            }
        })
        .returning({ id: marketingLeads.id });

    // 2. Handle Purchase Creation (The "Hold" Mechanism)
    let purchaseRef = null;
    let bankInstructions = null;

    if (confirmIntent && lead) {
        // Find or create shadow user for the purchase record (required by foreign key)
        let user = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail)
        });

        if (!user) {
            // If we have a connected wallet, use it as the primary ID
            const userId = (wallet_connected && wallet_connected.startsWith('0x')) 
                ? wallet_connected 
                : `lead-${lead.id.slice(0, 8)}`;

            // Check if a user with this wallet already exists
            const existingByWallet = (wallet_connected && wallet_connected.startsWith('0x'))
                ? await db.query.users.findFirst({ where: eq(users.id, wallet_connected) })
                : null;

            if (existingByWallet) {
                user = existingByWallet;
                // Optional: sync email if missing
                if (!user.email) {
                    await db.update(users).set({ email: normalizedEmail }).where(eq(users.id, user.id));
                }
            } else {
                await db.insert(users).values({
                    id: userId,
                    email: normalizedEmail,
                    name: name || 'Lead FastLane',
                    status: 'ACTIVE'
                });
                user = { id: userId } as any;
            }
        }

        // Generate Unique Reference
        const purchaseId = `SNARAI-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const idempotencyKey = `fastlane-${lead.id}-${tier || 'base'}-${new Date().toISOString().split('T')[0]}`;

        try {
            const [newPurchase] = await db.insert(purchases).values({
                userId: user!.id,
                projectId: projectIdNum,
                amount: safeAmount.toString(),
                currency: "USD",
                paymentMethod: 'wire',
                status: "on_hold" as any,
                purchaseId: purchaseId,
                idempotencyKey: idempotencyKey,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                metadata: {
                    source: 'fast_lane_intent',
                    leadId: lead.id,
                    tier: tier,
                    clabe: "058375000151370094",
                    beneficiary: "AZTECAZ HUB S.A.P.I. DE C.V.",
                    bank: "Banco Base"
                }
            }).onConflictDoNothing().returning({ purchaseId: purchases.purchaseId });
            
            purchaseRef = newPurchase?.purchaseId || purchaseId;
        } catch (e) {
            console.warn("Purchase record already exists or error:", e);
            // If it already exists, fetch it
            const existing = await db.query.purchases.findFirst({
                where: eq(purchases.idempotencyKey, idempotencyKey)
            });
            purchaseRef = existing?.purchaseId;
        }

        bankInstructions = {
            beneficiary: process.env.BANK_BENEFICIARY || "AZTECAZ HUB S.A.P.I. DE C.V.",
            clabe: process.env.BANK_CLABE || "058375000151370094",
            bank: process.env.BANK_NAME || "Banco Base",
            reference: purchaseRef,
            amount: safeAmount
        };
    }

    // 3. Trigger Growth OS
    if (lead) {
        const { processGrowthEvent } = await import("@/lib/marketing/growth-engine/engine-service");
        await processGrowthEvent(confirmIntent ? 'INTENT_CONFIRMED' : 'LEAD_CAPTURED', {
            id: lead.id,
            email: normalizedEmail,
            projectId: projectIdNum,
            intent: 'invest',
            metadata: { 
                tier, 
                amount: safeAmount,
                fast_lane: true,
                purchaseRef
            }
        });
    }

    return NextResponse.json({ 
        success: true, 
        leadId: lead?.id,
        purchaseRef,
        bankInstructions
    });
  } catch (error) {
    console.error('Fast-lane capture error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
