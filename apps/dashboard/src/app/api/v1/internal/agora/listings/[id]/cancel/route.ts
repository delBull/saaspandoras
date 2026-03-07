import { NextResponse } from 'next/server';
import { ListingService } from '@pandoras/agora-engine';
import { DrizzleListingStorageAdapter } from '@/agora-adapters/drizzle.listing.adapter';
import { DrizzleNAVStorageAdapter } from '@/crons/nav.cron';
import { DrizzleProtocolConfigAdapter } from '@/agora-adapters/drizzle.config.adapter';

/**
 * POST /api/v1/internal/agora/listings/[id]/cancel
 * Cancels an active listing, triggering the strict 5-minute cooldown.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let listingId = 'unknown';
    try {
        const { id } = await params;
        listingId = id;
        const body = await request.json();
        const { sellerId } = body;

        if (!listingId || !sellerId) {
            return NextResponse.json({ success: false, error: 'Missing listingId or sellerId' }, { status: 400 });
        }

        const listingAdapter = new DrizzleListingStorageAdapter();
        const navAdapter = new DrizzleNAVStorageAdapter();
        const configAdapter = new DrizzleProtocolConfigAdapter();

        const listingService = new ListingService(listingAdapter, navAdapter, configAdapter);

        await listingService.cancelListing(listingId, sellerId);

        return NextResponse.json({ success: true, message: 'Listing successfully cancelled.' });
    } catch (error: any) {
        console.error(`[API_AGORA_CANCEL] Error cancelling listing ${listingId}:`, error);

        let status = 500;
        if (error.message.includes('NOT_FOUND')) status = 404;
        if (error.message.includes('NOT_OWNER')) status = 403;
        if (error.message.includes('INVALID_STATE')) status = 400;

        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
