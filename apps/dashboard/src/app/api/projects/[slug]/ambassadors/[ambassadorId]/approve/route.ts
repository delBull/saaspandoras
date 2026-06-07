import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveProjectSlug } from '@/lib/project-utils';
import { sendAmbassadorWelcomeEmail } from '@/lib/email/ambassador-mailer';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string, ambassadorId: string }> }) {
    try {
        const { slug: rawSlug, ambassadorId } = await params;
        const slug = resolveProjectSlug(rawSlug);

        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 🛡️ Verify caller is the project owner
        const authHeaders = await headers();
        const { session } = await getAuth(authHeaders);
        if (!session?.address) {
            return NextResponse.json({ error: 'Unauthorized — session required' }, { status: 401 });
        }
        if (project.applicantWalletAddress?.toLowerCase() !== session.address.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden — not the project owner' }, { status: 403 });
        }

        const ambassador = await db.query.ambassadors.findFirst({
            where: eq(ambassadors.id, ambassadorId)
        });

        if (!ambassador || ambassador.projectId !== project.id) {
            return NextResponse.json({ error: 'Ambassador not found for this project' }, { status: 404 });
        }

        if (ambassador.status === 'active') {
            return NextResponse.json({ error: 'Ambassador is already active' }, { status: 400 });
        }

        // Send welcome email BEFORE setting active — if email fails, abort
        const emailResult = await sendAmbassadorWelcomeEmail({
            ambassadorName: ambassador.fullName,
            ambassadorEmail: ambassador.email,
            referralCode: ambassador.referralCode,
            origin: project.slug === 'snarai' ? 'snarai' : 'pandoras'
        });

        if (!emailResult.success) {
            console.error('[Approve Ambassador] Welcome email failed — approval aborted:', emailResult.error);
            return NextResponse.json({ error: 'Failed to send welcome email. Please check email configuration and try again.' }, { status: 502 });
        }

        // Approve only after email succeeds
        await db.update(ambassadors)
            .set({ status: 'active', updatedAt: new Date() })
            .where(eq(ambassadors.id, ambassadorId));

        return NextResponse.json({ success: true, emailId: emailResult.id });
    } catch (error) {
        console.error('[Approve Ambassador API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
