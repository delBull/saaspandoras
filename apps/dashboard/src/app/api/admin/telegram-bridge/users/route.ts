import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EDGE_URL = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || 'https://api-edge.pandora.finance';
const CORE_KEY = process.env.PANDORA_CORE_KEY || '';

export async function GET(request: Request) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
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

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error('[Dashboard User Proxy GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');

        if (!telegramId) {
            return NextResponse.json({ error: 'telegramId is required' }, { status: 400 });
        }

        const body = await request.json();
        // Force the adminId to be the current session address for the Edge logging
        body.adminId = session.address;

        const res = await fetch(`${EDGE_URL}/admin/telegram-users/${telegramId}`, {
            method: 'POST',
            headers: {
                'x-core-key': CORE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error('[Dashboard User Proxy POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
