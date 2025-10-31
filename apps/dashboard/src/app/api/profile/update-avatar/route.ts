import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    // Verify wallet address from headers
    const walletAddress = request.headers.get('x-wallet-address') ??
                         request.headers.get('x-thirdweb-address') ??
                         request.headers.get('x-user-address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 }
      );
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
