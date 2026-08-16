import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name, amount, leadId, projectId, tier } = body;

        if (!email || !name) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        // 1. Fetch or create user
        let user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            const [newUser] = await db.insert(users).values({
                id: crypto.randomUUID(),
                email,
                name,
                hasPandorasKey: false,
                role: 'user',
            }).returning();
            user = newUser;
        }

        if (!user) throw new Error('User creation failed');

        const purchaseRef = `HRMS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const pId = projectId ? Number(projectId) : 1; 

        // 2. Create purchase record
        await db.insert(purchases).values({
            userId: user.id,
            projectId: pId,
            amount: amount.toString(),
            currency: 'USD',
            paymentMethod: 'bank_transfer',
            status: 'pending',
            purchaseId: purchaseRef,
            idempotencyKey: `hrms-${Date.now()}-${email}`,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Expires in 48 hours
            metadata: {
                name,
                source: 'hermes_checkout',
                leadId,
                tier: tier || 'Hermes Growth Monthly',
                quantity: 1
            }
        });

        return NextResponse.json({ 
            success: true, 
            purchaseRef 
        });

    } catch (error) {
        console.error('[Hermes FastLane Error]:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
