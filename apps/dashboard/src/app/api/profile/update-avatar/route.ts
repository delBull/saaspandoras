import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@saasfly/auth-sdk';
import { db } from '@saasfly/db';
import { users } from '@saasfly/db/schema';
import { eq, sql } from "@saasfly/db-core";

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
    let targetUserEmail: string | null = null;
    const headerEmail = request.headers.get('x-operator-email');
    if (headerEmail) targetUserEmail = headerEmail.toLowerCase().trim();

    const { getNexusAuthContext } = await import('@saasfly/shared');
    const nexusAuth = await getNexusAuthContext(request.headers);
    if (nexusAuth.isAuthenticated) {
      if (nexusAuth.wallet && !walletAddress) walletAddress = nexusAuth.wallet.toLowerCase();
      if (nexusAuth.email && !targetUserEmail) targetUserEmail = nexusAuth.email.toLowerCase().trim();
    }

    if (targetUserEmail) {
      const [u] = await db
        .select({ id: users.id, walletAddress: users.walletAddress })
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${targetUserEmail})`)
        .limit(1);
      if (u) {
        targetUserId = u.id;
        if (!walletAddress && u.walletAddress) walletAddress = u.walletAddress;
      } else {
        // Auto-provision user record for the operator email so avatar persists
        const newUserId = `user_${Date.now()}`;
        const [newUser] = await db
          .insert(users)
          .values({
            id: newUserId,
            email: targetUserEmail,
            name: nexusAuth.name ?? targetUserEmail.split('@')[0],
            walletAddress: walletAddress ?? null,
            status: 'ACTIVE',
            role: nexusAuth.role === 'SUPER_ADMIN' ? 'super_admin' : 'operator',
          })
          .returning({ id: users.id });
        if (newUser) {
          targetUserId = newUser.id;
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
      : eq(users.walletAddress, walletAddress!.toLowerCase());

    const result = await db
      .update(users)
      .set({
        image
      })
      .where(updateCondition)
      .returning({ id: users.id, image: users.image });

    if (targetUserEmail) {
      db.update(users)
        .set({ image })
        .where(sql`LOWER(${users.email}) = LOWER(${targetUserEmail})`)
        .catch((e) => console.warn('[UpdateAvatar] Notice syncing users by email:', e));
    }

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: image,
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
