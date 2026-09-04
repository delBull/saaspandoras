import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, daoMembers } from '@/db/schema';
import { eq, ilike, and } from 'drizzle-orm';
import { getCanonicalAuth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: slug } = await params;
    const body = await req.json();
    const { discordWebhookUrl } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    // Verify Auth (B2B Admin or Super Admin)
    const { user: authInfo } = await getCanonicalAuth(req);
    if (!authInfo?.walletAddress) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      columns: { id: true, discordWebhookUrl: true }
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Validate if the user is a manager of this project (AuthZ)
    const membership = await db.query.daoMembers.findFirst({
      where: and(
        eq(daoMembers.projectId, project.id),
        ilike(daoMembers.wallet, authInfo.walletAddress)
      )
    });

    if (!membership && authInfo.walletAddress !== process.env.ADMIN_WALLET) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update the webhook
    await db.update(projects)
      .set({
        discordWebhookUrl: discordWebhookUrl || null,
      })
      .where(eq(projects.slug, slug));

    return NextResponse.json({
      success: true,
      data: {
        slug,
        discordWebhookUrl,
      }
    });
  } catch (error: any) {
    console.error('[Project Integrations Route] Error updating integrations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
