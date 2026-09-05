import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, ilike, or } from 'drizzle-orm';
import { getCanonicalAuth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    const body = await req.json();
    const { discordWebhookUrl } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier is required' }, { status: 400 });
    }

    // Verify Auth (Must be the user themselves or an admin)
    const { user: authInfo } = await getCanonicalAuth();
    if (!authInfo?.walletAddress) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security Check: Super Admin can bypass, otherwise ensure they are updating their own wallet
    const isSelf = authInfo.walletAddress.toLowerCase() === identifier.toLowerCase();
    
    if (!isSelf && authInfo.walletAddress !== process.env.ADMIN_WALLET) {
      return NextResponse.json({ success: false, error: 'Forbidden. You can only update your own settings.' }, { status: 403 });
    }

    const user = await db.query.users.findFirst({
      where: or(ilike(users.walletAddress, identifier), ilike(users.email, identifier)),
      columns: { id: true, discordWebhookUrl: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update the webhook
    await db.update(users)
      .set({
        discordWebhookUrl: discordWebhookUrl || null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      data: {
        identifier,
        discordWebhookUrl,
      }
    });
  } catch (error: any) {
    console.error('[Collaborator Webhook Route] Error updating webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
