import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const url = new URL(req.url);
        let website = url.searchParams.get('website');

        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized. Please login to Pandoras Dashboard first.' }, { status: 401 });
        }

        // Verify Project Ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Only the project owner can get the redirect with the injected secret token
        if (project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden. You are not the owner of this project.' }, { status: 403 });
        }

        // Use the secure backend secret
        const secret = process.env.PANDORAS_DATAROOM_SECRET;
        
        if (!website) {
            // Fallback to Pandoras internal resource hub if no website provided
            website = `https://dash.pandoras.finance/resources/${slug}`;
        }
        
        // Remove trailing slash if any
        website = website.replace(/\/$/, '');

        // Form the target URL
        const isSNaRai = website.includes('snarai');
        const targetPath = isSNaRai ? '/en/institutional' : `/resources/${slug}/institutional`;
        
        const redirectUrl = `${website}${targetPath}${secret ? `?p_unlock=${secret}` : ''}`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('[Growth OS] Error in Data Room redirect:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
