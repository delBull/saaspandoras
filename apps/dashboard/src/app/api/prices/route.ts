import { NextResponse } from 'next/server';

let cachedPrices: any = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
    const now = Date.now();

    if (cachedPrices && (now - lastFetch < CACHE_TTL)) {
        return NextResponse.json(cachedPrices, {
            headers: {
                'X-Cache': 'HIT',
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
            }
        });
    }

    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-ecosystem-token,matic-network,arbitrum,usd-coin,tether&vs_currencies=usd',
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 }
            }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API Error: ${response.status}`);
        }

        const data = await response.json();
        cachedPrices = data;
        lastFetch = now;

        return NextResponse.json(data, {
            headers: {
                'X-Cache': 'MISS',
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('Error fetching token prices:', error);

        // Return cached data if available even if expired, rather than hard fallback
        if (cachedPrices) return NextResponse.json(cachedPrices);

        return NextResponse.json({
            "ethereum": { "usd": 2200 },
            "polygon-ecosystem-token": { "usd": 0.8 },
            "matic-network": { "usd": 0.8 },
            "arbitrum": { "usd": 1.1 },
            "usd-coin": { "usd": 1.0 },
            "tether": { "usd": 1.0 }
        }, { status: 200 });
    }
}
