import { NextRequest, NextResponse } from "next/server";

// 🔧 THIRDWEB USERS API - Fetch Social Profile Data
// Backend endpoint para obtener datos sociales de usuarios Thirdweb

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // AQUI VA TU SECRET KEY DE THIRDWEB (BACKEND ONLY)
    const SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

    if (!SECRET_KEY) {
      console.error('❌ THIRDWEB_SECRET_KEY not found');
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Call Thirdweb API to get user details with social profiles
    const userResponse = await fetch(`https://api.thirdweb.com/v1/wallets/user?address=${address}&limit=1`, {
      method: 'GET',
      headers: {
        'x-secret-key': SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('❌ Thirdweb API error:', userResponse.status, errorData);
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    const { result } = await userResponse.json();
    const wallets = result?.wallets || [];

    if (wallets.length === 0) {
      return NextResponse.json({ error: "User not found in Thirdweb" }, { status: 404 });
    }

    const userData = wallets[0];
    console.log('✅ Thirdweb user data fetched:', userData.address);

    // Extract social profiles and format response
    const socialProfiles = userData.profiles || [];

    // Prepare enriched user data for our database
    const enrichedUserData = {
      walletAddress: userData.address,
      smartWalletAddress: userData.smartWalletAddress || null,
      createdAt: userData.createdAt || new Date().toISOString(),
      socialProfiles: socialProfiles.map((profile: any) => ({
        type: profile.type || 'unknown',
        email: profile.email || null,
        emailVerified: profile.emailVerified || false,
        name: profile.name || null,
        givenName: profile.givenName || null,
        familyName: profile.familyName || null,
        picture: profile.picture || null,
        locale: profile.locale || null,
        hd: profile.hd || null,
        id: profile.id || null,
      })),
      // Legacy fields for backward compatibility
      email: socialProfiles.find((p: any) => p.email)?.email || null,
      name: socialProfiles.find((p: any) => p.name)?.name || null,
      image: socialProfiles.find((p: any) => p.picture)?.picture || null,
    };

    // For analytics - track login methods
    const loginMethods = socialProfiles.map((p: any) => p.type || 'wallet').filter((t: string) => t !== 'wallet');
    console.log('📊 Login methods for user:', loginMethods);

    return NextResponse.json(enrichedUserData);

  } catch (error) {
    console.error('❌ Error fetching Thirdweb user data:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST method para sincronizar datos sociales del usuario autenticado
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // Obtener datos sociales del usuario usando GET method
    const url = new URL(request.url);
    url.pathname = '/api/thirdweb-fetch';
    url.searchParams.set('address', walletAddress);

    const response = await fetch(url.toString());
    const enrichedUserData = await response.json();

    if (!response.ok) {
      return NextResponse.json(enrichedUserData, { status: response.status });
    }

    console.log('🔄 Synchronizing social profiles for:', walletAddress);

    // Sincronizar con nuestra base de datos
    const syncResponse = await fetch(new URL('/api/user-sync/connect', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: enrichedUserData.walletAddress,
        email: enrichedUserData.email,
        name: enrichedUserData.name,
        image: enrichedUserData.image,
        socialProfiles: enrichedUserData.socialProfiles,
        smartWalletAddress: enrichedUserData.smartWalletAddress,
      }),
    });

    const syncResult = await syncResponse.json();

    if (syncResponse.ok) {
      console.log('✅ Social profile synchronized successfully');
      return NextResponse.json({
        success: true,
        message: 'Social profile synchronized',
        data: enrichedUserData,
        syncResult
      });
    } else {
      console.error('❌ Error synchronizing social profile:', syncResult);
      return NextResponse.json({ error: "Sync failed", details: syncResult }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in social profile sync:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
