import { NextResponse } from 'next/server';
import { ListingService, NAVService } from '@pandoras/agora-engine';
import { DrizzleListingStorageAdapter } from '@/agora-adapters/drizzle.listing.adapter';
import { DrizzleNAVStorageAdapter } from '@/crons/nav.cron'; // Assuming this is exported from nav.cron
import { DrizzleProtocolConfigAdapter } from '@/agora-adapters/drizzle.config.adapter';
import { db } from '@/db';
import { agoraListings, artifacts } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/v1/internal/agora/listings
 * Fetch ACTIVE and LOCKED listings for the market.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const protocolIdStr = searchParams.get('protocolId');
        const artifactId = searchParams.get('artifactId');

        // Build conditions dynamically
        const conditions = [];
        conditions.push(inArray(agoraListings.status, ['ACTIVE', 'LOCKED']));

        if (protocolIdStr) {
            conditions.push(eq(agoraListings.protocolId, parseInt(protocolIdStr)));
        }
        if (artifactId) {
            conditions.push(eq(agoraListings.artifactId, artifactId));
        }

        const listings = await db.query.agoraListings.findMany({
            where: and(...conditions),
            orderBy: (aliases, { asc }) => [asc(aliases.price)], // Sort by price ascending
            with: {
                // Assume you'd want to populate the artifact metadata if relations were fully set
                // But for now, we return raw listing details.
            }
        });

        return NextResponse.json({ success: true, count: listings.length, data: listings });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/v1/internal/agora/listings
 * Intention to sell: Creates an ACTIVE listing.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { protocolId, artifactId, sellerId, price } = body;

        if (!protocolId || !artifactId || !sellerId || !price) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const listingAdapter = new DrizzleListingStorageAdapter();
        const navAdapter = new DrizzleNAVStorageAdapter();
        const configAdapter = new DrizzleProtocolConfigAdapter();

        const listingService = new ListingService(listingAdapter, navAdapter, configAdapter);

        const result = await listingService.createListing(
            parseInt(protocolId),
            artifactId,
            sellerId,
            price
        );

        if (!result.success) {
            // Return 409 Conflict if it's a cooldown issue
            if (result.error === 'COOLDOWN_ACTIVE') {
                return NextResponse.json(result, { status: 429 });
            }
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json({ success: true, listingId: result.listingId });
    } catch (error: any) {
        console.error('[API_AGORA_LISTING] POST error:', error);
        // Determine status based on message
        let status = 500;
        if (error.message.includes('NOT_OWNER')) status = 403;
        if (error.message.includes('ALREADY_LISTED')) status = 409;
        if (error.message.includes('BELOW_MIN') || error.message.includes('ABOVE_MAX')) status = 400;
        if (error.message.includes('MARKET_PAUSED')) status = 503;

        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
