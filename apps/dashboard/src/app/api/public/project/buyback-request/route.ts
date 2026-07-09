import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects as projectsSchema, buybackRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/public/project/buyback-request
 * Handles requests from end users (S'Narai Portal) to apply for an exceptional early exit.
 * Triggers a Discord webhook notification for admins and stores the intent in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { protocolId, wallet, amount, reason } = body;

        if (!protocolId || !wallet) {
            return NextResponse.json({ success: false, error: 'Missing protocolId or wallet' }, { status: 400, headers: corsHeaders });
        }

        const project = await db.query.projects.findFirst({
            where: eq(projectsSchema.id, parseInt(protocolId, 10))
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404, headers: corsHeaders });
        }

        const ticketId = crypto.randomUUID();

        // Guardamos la intención de manera persistente en BD
        await db.insert(buybackRequests).values({
            id: ticketId,
            projectId: project.id,
            wallet: wallet,
            amountRequested: amount || 'TBD',
            reason: reason || 'Exceptional Early Exit requested via Portal',
            status: 'PENDING'
        });

        const discordWebhookUrl = project.discordWebhookUrl || process.env.DISCORD_ALERTS_WEBHOOK;

        if (discordWebhookUrl) {
            try {
                await fetch(discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `🚨 **New Treasury Buyback Request** 🚨\n\n**Project:** ${project.title}\n**Wallet:** \`${wallet}\`\n**Amount (est):** ${amount || 'Unknown'}\n**Reason:** ${reason || 'Exceptional Early Exit requested via Portal'}\n**ID:** \`${ticketId}\``,
                        username: "S'Narai Treasury Alerts",
                        avatar_url: project.logoUrl || "https://dash.pandoras.finance/favicon.ico"
                    })
                });
            } catch (webhookError) {
                console.warn('[API_BUYBACK_REQUEST] Failed to send Discord webhook', webhookError);
            }
        }

        return NextResponse.json({
            success: true,
            ticketId: ticketId,
            message: 'Buyback request submitted successfully.'
        }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('[API_BUYBACK_REQUEST] Execution failed:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
