import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { nexusCollaborators, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { utils } from 'ethers';

export async function POST(req: Request) {
  try {
    const auth = await getNexusAuthContext();

    if (!auth.isAuthenticated || !auth.wallet) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No wallet session' }, { status: 401 });
    }

    const { discordId, signature, message, walletAddress } = await req.json();

    if (!discordId || !signature || !message || !walletAddress) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Verify signature matches the provided wallet
    let recoveredAddress: string;
    try {
      recoveredAddress = utils.verifyMessage(message, signature);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid signature format' }, { status: 400 });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Signature address mismatch' }, { status: 403 });
    }

    // Double check that the signing wallet is actually the logged in user
    if (auth.wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Session mismatch: You must sign with your logged in wallet' }, { status: 403 });
    }

    // The user logging in might only be in `users` table, not `nexusCollaborators` yet if they were just granted permissions.
    // However, projectCollaborators links to nexusCollaborators. We must ensure they have a nexusCollaborator record.
    const userRecords = await db.select().from(users).where(eq(users.walletAddress, auth.wallet.toLowerCase())).limit(1);
    
    if (userRecords.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found in registry' }, { status: 404 });
    }
    
    const user = userRecords[0];

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'User missing email in registry' }, { status: 404 });
    }

    // Find nexusCollaborator by email
    const collabs = await db.select().from(nexusCollaborators).where(eq(nexusCollaborators.email, user.email)).limit(1);
    
    if (collabs.length === 0) {
      // If they don't have a nexus_collaborators record but they are an admin, we could create it,
      // but typically they are created through the invitation flow.
      return NextResponse.json({ success: false, error: 'No collaborator profile found for this email. Contact your Admin.' }, { status: 404 });
    }

    const collab = collabs[0];
    if (!collab) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Update the discord user id
    await db.update(nexusCollaborators)
      .set({ discordUserId: discordId })
      .where(eq(nexusCollaborators.id, collab.id));

    return NextResponse.json({ success: true, collaboratorId: collab.id });
  } catch (error: any) {
    console.error('[Discord Link API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
