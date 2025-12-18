import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

const DISCORD_WEBHOOK_LEADS = process.env.DISCORD_WEBHOOK_WHATSAPP_LEADS || '';
const DISCORD_WEBHOOK_APPLICATIONS = process.env.DISCORD_WEBHOOK_APPLICATIONS || '';
const DISCORD_WEBHOOK_ALERTS = process.env.DISCORD_WEBHOOK_ALERTS || '';

export async function POST(request: Request) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.userId || !await isAdmin(session.userId)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { channel, content } = await request.json();
        let webhookUrl = '';

        switch (channel) {
            case 'leads': webhookUrl = DISCORD_WEBHOOK_LEADS; break;
            case 'applications': webhookUrl = DISCORD_WEBHOOK_APPLICATIONS; break;
            case 'alerts': webhookUrl = DISCORD_WEBHOOK_ALERTS; break;
            default: return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
        }

        if (!webhookUrl) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `📢 **Announcement from Dashboard**:\n\n${content}` })
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
