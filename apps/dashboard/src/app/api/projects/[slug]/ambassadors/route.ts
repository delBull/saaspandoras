import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { ambassadors, projects } from '@saasfly/db/schema';
import { eq, desc, and } from "@saasfly/db-core";
import { resolveProjectSlug } from '@saasfly/shared';

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
    } catch (error: any) {
        console.error('[Get Ambassadors API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error?.message || String(error), stack: error?.stack }, { status: 500 });
    }
}
