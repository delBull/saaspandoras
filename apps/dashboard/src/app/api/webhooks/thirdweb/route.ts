import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, purchases, daoMembers, integrationClients } from "@/db/schema";
import { sendPaymentNotification } from "@/lib/discord/notifier";
import { WebhookService } from "@/lib/integrations/webhook-service";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { LegalEngine } from "@/lib/legal/engine";

// Security: Fail-closed signature verification for thirdweb Pay / Engine webhooks.
// Payloads are signed with HMAC-SHA256 over the raw request body using THIRDWEB_WEBHOOK_SECRET.
// The signature header can arrive as raw hex, "sha256=<hex>", or "t=<ts>,v1=<hex>";
// we accept any format and require a match before the request is processed.
function verifyWebhookSignature(req: Request, rawBody: string, secret: string): boolean {
    const header = req.headers.get("x-thirdweb-signature") ||
        req.headers.get("x-webhook-signature") ||
        req.headers.get("x-engine-signature");

    if (!header) return false;

    const provided: string[] = [];
    let timestamp: string | undefined;

    for (const part of header.split(",")) {
        const token = part.trim();
        const eqIndex = token.indexOf("=");
        if (eqIndex === -1) {
            provided.push(token);
            continue;
        }
        const key = token.slice(0, eqIndex).toLowerCase();
        const value = token.slice(eqIndex + 1);
        if (key === "t") timestamp = value;
        else provided.push(value);
    }

    if (provided.length === 0) return false;

    const expected = provided.map((s) => Buffer.from(s, "hex"));
    const payloads = timestamp ? [rawBody, `${timestamp}.${rawBody}`] : [rawBody];

    for (const payload of payloads) {
        const digest = crypto.createHmac("sha256", secret).update(payload).digest();
        for (const candidate of expected) {
            if (candidate.length === digest.length && crypto.timingSafeEqual(candidate, digest)) {
                return true;
            }
        }
    }
    return false;
}

function isHexWallet(value: string | undefined): value is string {
    return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text(); // Raw body is required for signature verification

        // 1. Signature Verification (fail-closed: no secret installed => refuse)
        const secret = process.env.THIRDWEB_WEBHOOK_SECRET;
        if (!secret) {
            console.error("❌ [THIRDWEB_WEBHOOK] THIRDWEB_WEBHOOK_SECRET not configured — refusing to process");
            return NextResponse.json(
                { error: "THIRDWEB_WEBHOOK_SECRET not configured" },
                { status: 503 }
            );
        }
        if (!verifyWebhookSignature(req, rawBody, secret)) {
            console.warn("🚫 [THIRDWEB_WEBHOOK] Invalid signature — blocked");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);

        // 2. Event Filtering (resource optimization): only Transfer events / test pings
        const eventName = body.eventName || body.event || body.logs?.[0]?.eventName;
        if (eventName !== "Transfer" && body.type !== "TEST_NOTIFICATION") {
            console.log(`⚠️ [THIRDWEB_WEBHOOK] Ignoring filtered event: ${eventName || body.type}`);
            return NextResponse.json({ status: "ignored" });
        }

        if (body.type === "TEST_NOTIFICATION") {
            console.log("✅ [THIRDWEB_WEBHOOK] Test notification acknowledged");
            return NextResponse.json({ status: "ok" });
        }

        console.log("🕸️ [THIRDWEB_WEBHOOK] Processing Transfer:", JSON.stringify(body, null, 2));

        // 3. Extract Transfer Data (Decoded args from Transfer(from, to, value))
        const log = body.logs?.[0];
        const txHash = body.transactionHash || log?.transactionHash || "unknown";

        let fromAddress = "unknown";
        let toAddress = "unknown";
        let value = "0";

        if (log?.args) {
            fromAddress = log.args.from || log.args[0] || "unknown";
            toAddress = log.args.to || log.args[1] || "unknown";
            value = log.args.value ?? log.args[2] ?? "0";
        } else if (body.from && body.to) {
            // Fallback for Wallet Activity webhooks
            fromAddress = body.from;
            toAddress = body.to;
            value = body.value || body.amount || "0";
        }

        const isMint = fromAddress === "0x0000000000000000000000000000000000000000" || fromAddress === "0x0";

        // 4. Resolve + VALIDATE purchase BEFORE mutating anything
        const purchaseId = body.metadata?.purchaseId || body.purchaseId;
        let purchase: typeof purchases.$inferSelect | undefined = undefined;

        if (purchaseId) {
            purchase = await db.query.purchases.findFirst({ where: eq(purchases.purchaseId, purchaseId) });

            if (!purchase) {
                console.error(`❌ [THIRDWEB_WEBHOOK] purchaseId ${purchaseId} not found — refusing to complete`);
                return NextResponse.json({ error: "Purchase not found" }, { status: 400 });
            }

            // Idempotency: never re-process a completed purchase
            if (purchase.status === "completed") {
                console.log(`♻️ [THIRDWEB_WEBHOOK] Purchase ${purchaseId} already completed — idempotent no-op`);
                return NextResponse.json({ success: true, idempotent: true });
            }

            // Cryptographic integrity: a purchase cannot be finalized without an on-chain hash
            if (!txHash || txHash === "unknown") {
                console.error(`❌ [THIRDWEB_WEBHOOK] ${purchaseId} missing on-chain txHash — refusing`);
                return NextResponse.json({ error: "Missing transaction hash" }, { status: 400 });
            }

            // Zero-value transfers are never purchases
            if ((Number(value) || 0) <= 0) {
                console.error(`❌ [THIRDWEB_WEBHOOK] ${purchaseId} reported value ${value} — refusing`);
                return NextResponse.json({ error: "Invalid transfer value" }, { status: 400 });
            }

            // Completing a purchase for an unknown wallet is a red flag
            if (!isHexWallet(toAddress)) {
                console.error(`❌ [THIRDWEB_WEBHOOK] ${purchaseId} recipient is not a valid wallet — refusing`);
                return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
            }
        }

        // 5. Record DB Entry (ledger of observed transfers)
        await db.insert(transactions).values({
            amount: value.toString(),
            currency: 'CRYPTO',
            method: 'crypto',
            status: 'completed',
            processedAt: new Date(),
        });

        // 6. Complete the purchase, notify Edge API and sync DAO membership
        if (purchase && purchaseId) {
            try {
                await db
                    .update(purchases)
                    .set({
                        status: 'completed',
                        transactionHash: txHash,
                        updatedAt: new Date(),
                    })
                    .where(eq(purchases.purchaseId, purchaseId));

                const metadata = purchase.metadata as any;
                const edgeWebhookUrl = process.env.TELEGRAM_EDGE_API_URL + '/core/callback';
                const edgeSecret = process.env.CORE_CALLBACK_SECRET;

                if (edgeWebhookUrl && edgeSecret) {
                    const payload = {
                        type: 'PURCHASE_COMPLETED',
                        actionId: purchaseId,
                        telegramUserId: metadata?.paymentConfig?.payOptions?.metadata?.telegramId,
                        amount: Number(purchase.amount),
                        protocolId: metadata?.paymentConfig?.payOptions?.metadata?.projectId,
                        timestamp: Math.floor(Date.now() / 1000)
                    };

                    const signature = crypto
                        .createHmac('sha256', edgeSecret)
                        .update(JSON.stringify(payload))
                        .digest('hex');

                    await fetch(edgeWebhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-core-signature': signature
                        },
                        body: JSON.stringify(payload)
                    });
                    console.log(`📡 [THIRDWEB_WEBHOOK] Notified Edge API of completed purchase: ${purchaseId}`);
                }

                // 🏛️ DAO Membership Sync: register or update the holder
                try {
                    const wallet = purchase.userId.toLowerCase();
                    const projectId = purchase.projectId;
                    const count = 1;

                    await db.insert(daoMembers)
                        .values({
                            projectId,
                            wallet,
                            artifactsCount: count,
                            votingPower: count.toString(),
                            joinedAt: new Date(),
                            lastActiveAt: new Date(),
                        })
                        .onConflictDoUpdate({
                            target: [daoMembers.projectId, daoMembers.wallet],
                            set: {
                                artifactsCount: sql`${daoMembers.artifactsCount} + ${count}`,
                                votingPower: sql`(${daoMembers.votingPower}::integer + ${count})::text`,
                                lastActiveAt: new Date(),
                            }
                        });
                    console.log(`🏛️ [THIRDWEB_WEBHOOK] DAO member synchronized for wallet ${wallet} in project ${projectId}`);
                } catch (daoError: any) {
                    console.error("❌ [THIRDWEB_WEBHOOK] Failed to sync DAO member:", daoError.message);
                }
            } catch (err) {
                console.error(`⚠️ [THIRDWEB_WEBHOOK] Error completing purchase ${purchaseId}:`, err);
            }
        }

        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                type: 'PURCHASE_COMPLETED_WEBHOOK',
                purchaseId,
                amount: value.toString(),
                txHash,
                timestamp: new Date().toISOString()
            }));
        }

        // 7. Notify Discord
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(value),
            currency: "PANDORAS_KEY (Events)",
            method: "crypto",
            status: "completed",
            metadata: {
                message: "Pandoras Key Transfer Detected",
                from: fromAddress,
                to: toAddress,
                txHash: txHash
            }
        });

        // 8. MINT events: legal certification + notify external clients + DAO membership
        if (isMint) {
            console.log(`✅ [THIRDWEB_WEBHOOK] DETECTED MINT EVENT - from: ${fromAddress}, to: ${toAddress}`);

            try {
                const tokenId = log?.args?.tokenId || log?.args?.[0] || "unknown";

                // ⚖️ V3: Generate Legal Integrity Proof & Certification
                if (purchase && purchaseId && tokenId !== "unknown") {
                    await LegalEngine.certifyPurchase(purchaseId, tokenId.toString());
                }

                // Broadcast to all active clients
                const clients = await db.query.integrationClients.findMany({
                    where: eq(integrationClients.isActive, true)
                });

                for (const client of clients) {
                    await WebhookService.queueEvent(client.id, 'nft.minted', {
                        contractAddress: log?.address || "unknown",
                        tokenId: tokenId,
                        recipient: toAddress,
                        txHash: txHash,
                        isSandbox: client.environment === 'staging'
                    });
                }
                if (clients.length > 0) {
                    console.log(`📡 Mint Webhook(s) queued for ${clients.length} clients.`);
                }
            } catch (webhookError) {
                console.warn('⚠️ Failed to queue mint webhook:', webhookError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Thirdweb Webhook Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}