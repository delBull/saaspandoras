import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, projects } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { resolveProjectSlug } from '@/lib/project-utils';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug: rawSlug } = await params;
        const slug = resolveProjectSlug(rawSlug);

        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectAmbassadors = await db.query.ambassadors.findMany({
            where: and(
                eq(ambassadors.projectId, project.id),
                eq(ambassadors.emailVerified, true)
            ),
            orderBy: desc(ambassadors.createdAt)
        });

        return NextResponse.json(projectAmbassadors);
    } catch (error) {
        console.error('[Get Ambassadors API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
