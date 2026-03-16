import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EDGE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const CORE_KEY = process.env.PANDORA_CORE_KEY;

export async function PATCH(
    req: NextRequest,
    { params }: { params: { missionId: string } }
) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const missionId = params.missionId;
        const body = await req.json();

        const response = await fetch(`${EDGE_API_URL}/gamification/admin/missions/${missionId}`, {
            method: 'PATCH',
            headers: {
                'x-pandora-key': CORE_KEY || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error: `Edge API Error: ${error}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[Mission Patch Proxy]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
