import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EDGE_URL = process.env.NEXT_PUBLIC_PANDORAS_EDGE_URL || 'https://api-edge.pandora.finance';
const CORE_KEY = process.env.PANDORA_CORE_KEY || '';

export async function GET() {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const res = await fetch(`${EDGE_URL}/faucet/admin/pending`, {
            headers: {
                'Authorization': `Bearer ${CORE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => 'No response body');
            console.error(`[Dashboard Faucet Proxy GET] Edge API error ${res.status}:`, errorText);
            return NextResponse.json({ error: `Edge API returned ${res.status}`, details: errorText.slice(0, 200) }, { status: res.status });
        }

        const data = await res.json().catch(() => null);
        if (!data) {
            return NextResponse.json({ error: 'Invalid JSON response from Edge API' }, { status: 502 });
        }
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error('[Dashboard Faucet Proxy GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, action } = body; // action: 'approve' | 'reject'

        if (!id || !action) {
            return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
        }

        const endpoint = action === 'approve' ? 'approve' : 'reject';
        
        const res = await fetch(`${EDGE_URL}/faucet/admin/${endpoint}/${id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CORE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId: session.address })
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        console.error('[Dashboard Faucet Proxy POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
