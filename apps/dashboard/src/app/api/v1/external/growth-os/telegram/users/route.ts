import { NextRequest, NextResponse } from 'next/server';
import { validateExternalKey } from '@/lib/api-auth/validate-external-key';

export const dynamic = 'force-dynamic';

const EDGE_URL = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || 'https://api-edge.pandora.finance';
const CORE_KEY = process.env.PANDORA_CORE_KEY || '';

/**
 * GET /api/v1/external/growth-os/telegram/users
 * 
 * Secure proxy to Telegram User Discovery.
 * Query params:
 *  ?q=username_or_wallet
 *  ?telegramId=123456
 */
export async function GET(req: NextRequest) {
    const { client, error } = await validateExternalKey(req, "read:growth_os");
    if (error || !client) {
        return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const telegramId = searchParams.get('telegramId');

        let url = `${EDGE_URL}/admin/telegram-users`;
        if (telegramId) {
            url += `/${telegramId}`;
        } else if (query) {
            url += `?q=${encodeURIComponent(query)}`;
        }

        const res = await fetch(url, {
            headers: {
                'x-core-key': CORE_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json({ 
                error: "Edge Proxy Error", 
                status: res.status,
                detail: errData.error || res.statusText 
            }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({
            success: true,
            data
        });

    } catch (e: any) {
        console.error("[external:telegram:users] Proxy Error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
