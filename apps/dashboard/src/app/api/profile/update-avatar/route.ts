import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    // Require verified JWT session (fallback to header for TMA)
    const auth = await getAuth();
    let walletAddress = auth.isVerified && auth.session?.address ? auth.session.address : null;
    
    // TMA fallback: if no JWT, try header (Thirdweb sets x-wallet-address)
    if (!walletAddress) {
      const headerWallet = request.headers.get('x-thirdweb-address') ??
        request.headers.get('x-wallet-address') ??
        request.headers.get('x-user-address');
      if (headerWallet) walletAddress = headerWallet.toLowerCase();
    }
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Valid image URL required' },
        { status: 400 }
      );
    }

    // Validate image URL is a known avatar or uploaded image
    const allowedAvatars = [
      '/images/avatars/onlybox2.png',
      '/images/avatars/rasta.png'
    ];

    // For now only allow these predefined avatars
    if (!allowedAvatars.includes(image)) {
      return NextResponse.json(
        { error: 'Invalid avatar selection' },
        { status: 400 }
      );
    }

    // Update user profile in database
    const result = await db
      .update(users)
      .set({
        image
      })
      .where(
        and(
          eq(users.walletAddress, walletAddress.toLowerCase()),
        )
      )
      .returning({ id: users.id, image: users.image });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result[0],
      message: 'Avatar updated successfully'
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
