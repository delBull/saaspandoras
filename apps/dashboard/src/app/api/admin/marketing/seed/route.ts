import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { seedMarketingCampaigns } from '@/lib/marketing/seed-campaigns';

export async function POST(req: NextRequest) {
    // 1. Auth check
    const { session } = await getAuth();
    if (!session?.address) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Admin check
    const SUPER_ADMIN_WALLET = process.env.SUPER_ADMIN_WALLET?.toLowerCase();
    if (session.address !== SUPER_ADMIN_WALLET) {
        return new NextResponse('Forbidden - Admin only', { status: 403 });
    }

    try {
        await seedMarketingCampaigns();
        return NextResponse.json({ ok: true, message: 'Campaigns seeded successfully' });
    } catch (error) {
        console.error('[Marketing Seed] Error:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
