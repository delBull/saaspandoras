import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-ecosystem-token,matic-network,arbitrum,usd-coin,tether&vs_currencies=usd',
            {
                headers: {
                    'Accept': 'application/json',
                    // Add API Key here if available in env, e.g. 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
                },
                next: { revalidate: 60 } // Cache for 60 seconds
            }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API Error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching token prices:', error);
        // Return default fallback data to prevent UI crash
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
