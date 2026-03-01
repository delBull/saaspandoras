import { db } from "@/db";
import { purchases, users, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendBusinessNotification } from "@/lib/discord/business-notifier";

/**
 * POST /api/v1/internal/payments/intent
 * 
 * S2S Endpoint for Pandoras Edge to request a payment intent.
 * Persists the intent and returns the configuration for the frontend.
 */
export async function POST(req: Request) {
    // 1. S2S Authentication
    const authHeader = req.headers.get("Authorization");
    const PANDORA_CORE_KEY = process.env.PANDORA_CORE_KEY;

    if (!PANDORA_CORE_KEY || authHeader !== `Bearer ${PANDORA_CORE_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            telegramId,
            projectId,
            amount,
            paymentMethod,
            idempotencyKey,
            metadata = {}
        } = body;

        if (!telegramId || !projectId || !amount || !paymentMethod || !idempotencyKey) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Validate Project
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, Number(projectId))
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // 3. Find or Create User by Telegram ID (Support Standalone)
        let user = await db.query.users.findFirst({
            where: eq(users.telegramId, telegramId)
        });

        if (!user) {
            const newUserId = `tg-${telegramId}-${crypto.randomBytes(3).toString('hex')}`;
            await db.insert(users).values({
                id: newUserId,
                telegramId: telegramId,
                status: 'ACTIVE',
                kycLevel: 'basic',
                kycCompleted: false
            });
            user = await db.query.users.findFirst({
                where: eq(users.id, newUserId)
            });
        }

        if (!user) {
            throw new Error("Failed to create shadow user in Core");
        }

        // 4. Idempotency Check
        const existingPurchase = await db.query.purchases.findFirst({
            where: eq(purchases.idempotencyKey, idempotencyKey)
        });

        if (existingPurchase) {
            const metadata = existingPurchase.metadata as any;
            return NextResponse.json({
                purchaseId: existingPurchase.purchaseId,
                status: existingPurchase.status,
                paymentConfig: metadata?.paymentConfig || {}
            });
        }

        // 5. Generate Internal purchaseId
        const purchaseId = `PUR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // 6. Define Expiry
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // 7. Construct Payment Configuration (Thirdweb Pay Options)
        // This config will be passed to PayEmbed in the MiniApp
        const paymentConfig: any = {
            purchaseId,
            amount,
            currency: "USD",
            projectId: project.id,
            projectTitle: project.title,
            payOptions: {
                prefillBuy: {
                    amount: amount.toString(),
                    // We could add token/chain here if needed
                },
                metadata: {
                    purchaseId,
                    telegramId,
                    projectId: project.id.toString()
                }
            }
        };

        // 8. Persist Purchase Intent
        await db.insert(purchases).values({
            userId: user.id,
            projectId: project.id,
            amount: amount.toString(),
            currency: "USD",
            paymentMethod,
            status: "pending",
            purchaseId,
            idempotencyKey,
            expiresAt,
            metadata: {
                ...metadata,
                paymentConfig
            }
        });

        // 9. Send internal business metric notification
        await sendBusinessNotification(
            "Purchase Intent Created",
            {
                PurchaseId: purchaseId,
                Amount: `$${amount} USD`,
                Project: project.title,
                UserTelegramId: telegramId,
            },
            "info"
        );

        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                type: 'PURCHASE_INTENT_CREATED',
                purchaseId,
                projectId: project.id,
                amount: amount.toString(),
                telegramId,
                timestamp: new Date().toISOString()
            }));
        }

        return NextResponse.json({
            purchaseId,
            paymentConfig,
            expiresAt: expiresAt.toISOString()
        });

    } catch (e: any) {
        console.error("Internal Payment Intent API Error:", e);
        return NextResponse.json({
            error: "Internal Server Error",
            message: e.message
        }, { status: 500 });
    }
}
