import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@saasfly/auth-sdk';
import { db } from '@saasfly/db';
import { users } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

interface UpdateAvatarRequestBody {
  image?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    // Require verified JWT session (fallback to header for TMA)
    const auth = await getAuth();
    const sessionAddress = auth.isVerified && auth.session && 'address' in auth.session && typeof auth.session.address === 'string'
      ? auth.session.address
      : null;
    let walletAddress: string | null = sessionAddress;
    
    // TMA fallback: if no JWT, try header (Thirdweb sets x-wallet-address)
    if (!walletAddress) {
      const headerWallet = request.headers.get('x-thirdweb-address') ??
        request.headers.get('x-wallet-address') ??
        request.headers.get('x-user-address');
      if (headerWallet) walletAddress = headerWallet.toLowerCase();
    }

    let targetUserId: string | null = null;
    if (!walletAddress) {
      const { getNexusAuthContext } = await import('@saasfly/shared');
      const nexusAuth = await getNexusAuthContext(request.headers);
      if (nexusAuth.isAuthenticated) {
        if (nexusAuth.wallet) walletAddress = nexusAuth.wallet.toLowerCase();
        if (nexusAuth.email) {
          const [u] = await db
            .select({ id: users.id, walletAddress: users.walletAddress })
            .from(users)
            .where(eq(users.email, nexusAuth.email.toLowerCase().trim()))
            .limit(1);
          if (u) {
            targetUserId = u.id;
            if (u.walletAddress) walletAddress = u.walletAddress;
          }
        }
      }
    }
    
    if (!walletAddress && !targetUserId) {
      return NextResponse.json({ error: 'Wallet address or authenticated session required' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as UpdateAvatarRequestBody;
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

    // Allow predefined avatars or uploaded blob/cdn URLs
    const isAllowed = allowedAvatars.includes(image) || image.startsWith('http://') || image.startsWith('https://');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Invalid avatar selection' },
        { status: 400 }
      );
    }

    // Update user profile in database
    const updateCondition = targetUserId 
      ? eq(users.id, targetUserId)
      : eq(users.walletAddress, (walletAddress as string).toLowerCase());

    const result = await db
      .update(users)
      .set({
        image
      })
      .where(updateCondition)
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
