import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects, purchases, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: rawProjectId } = await params;
    const projectId = Number(rawProjectId);
    
    if (isNaN(projectId)) {
        return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
    }
    const body = await req.json();
    const { email, name, phone, amount, tier, source, wallet_connected, wallet_address, confirmIntent } = body;
    
    if (!email || !amount || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: "Email y monto son requeridos" }, { status: 400 });
    }

    const safeAmount = parseFloat(amount);
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    
    const isWhale = safeAmount >= 500;
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Identity & Lead Management
    const { IdentityService } = await import("@/lib/marketing/identity-service");
    const identityHash = IdentityService.getIdentityHash(normalizedEmail, null, null);
    
    const insertValues = {
        projectId: projectId,
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

    // Manual Upsert to avoid PostgreSQL ON CONFLICT constraint issues with nullable indexes
    const existingLead = await db.query.marketingLeads.findFirst({
        where: and(
            eq(marketingLeads.projectId, projectId),
            eq(marketingLeads.identityHash, identityHash as string)
        )
    });

    let lead;
    if (existingLead) {
        [lead] = await db.update(marketingLeads)
            .set({
                name: name || undefined,
                phoneNumber: phone || undefined,
                status: insertValues.status,
                metadata: insertValues.metadata,
                updatedAt: new Date()
            })
            .where(eq(marketingLeads.id, existingLead.id))
            .returning({ id: marketingLeads.id });
    } else {
        [lead] = await db.insert(marketingLeads)
            .values(insertValues)
            .returning({ id: marketingLeads.id });
    }

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
            const userId = (wallet_address && typeof wallet_address === 'string' && wallet_address.startsWith('0x')) 
                ? wallet_address 
                : `lead-${lead.id.slice(0, 8)}`;

            // Check if a user with this wallet already exists
            const existingByWallet = (wallet_address && typeof wallet_address === 'string' && wallet_address.startsWith('0x'))
                ? await db.query.users.findFirst({ where: eq(users.id, wallet_address) })
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

        // Generate Unique Reference without Node.js crypto module to ensure Edge compatibility
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const purchaseId = `SNARAI-${randomString}`;
        const idempotencyKey = `fastlane-${lead.id}-${tier || 'base'}-${new Date().toISOString().split('T')[0]}`;

        let newPurchase;
        try {
            newPurchase = (await db.insert(purchases).values({
                projectId: Number(projectId),
                userId: user!.id,
                amount: safeAmount.toString(),
                status: 'on_hold',
                paymentMethod: 'bank_transfer',
                idempotencyKey,
                purchaseId: purchaseId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                metadata: {
                    name,
                    phone,
                    tier: tier || 'default',
                    source: source || 'external_commerce',
                    wallet_connected
                }
            }).returning())[0];
        } catch (e) {
            console.warn("Purchase record creation error:", e);
            // If it already exists, fetch it
            const existing = await db.query.purchases.findFirst({
                where: eq(purchases.idempotencyKey, idempotencyKey)
            });
            purchaseRef = existing?.purchaseId;
        }

        if (newPurchase) {
            purchaseRef = newPurchase.purchaseId;
        }

        const legalConfig = project.legalConfig as any || {};
        const customBank = legalConfig.bankInstructions || {};

        bankInstructions = {
            beneficiary: customBank.beneficiary || process.env.BANK_BENEFICIARY || "AZTECAZ HUB S.A.P.I. DE C.V.",
            clabe: customBank.clabe || process.env.BANK_CLABE || "058375000151370094",
            bank: customBank.bank || process.env.BANK_NAME || "Banco Base",
            reference: purchaseRef,
            amount: safeAmount
        };
    }

    // 3. Trigger Growth OS
    if (lead) {
        try {
            const { processGrowthEvent } = await import("@/lib/marketing/growth-engine/engine-service");
            await processGrowthEvent(confirmIntent ? 'FAST_LANE_CHECKOUT' as any : 'LEAD_CAPTURED', {
                id: lead.id,
                email: normalizedEmail,
                projectId: projectId,
                intent: 'invest',
                metadata: { 
                    tier, 
                    amount: safeAmount,
                    fast_lane: true,
                    purchaseRef
                }
            });
        } catch (growthErr) {
            console.warn('[FastLane] Growth engine event failed (non-critical):', growthErr);
        }
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
