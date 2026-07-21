'use server';

import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { projects } from '@/db/schema';

export async function getProjectForAuth(slug: string) {
    try {
        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug)
        });
        
        if (!project) return null;
        
        return {
            title: project.title,
            chainId: project.chainId,
            logoUrl: project.logoUrl,
            themeColor: project.themeColor
        };
    } catch (error) {
        console.error("Error fetching project for auth:", error);
        return null;
    }
}
