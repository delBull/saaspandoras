'use server';

import { db } from '@saasfly/db';
import { eq } from "@saasfly/db-core";
import { projects } from '@saasfly/db/schema';

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
            themeColor: (project.extraConfig as any)?.themeColor || null
        };
    } catch (error) {
        console.error("Error fetching project for auth:", error);
        return null;
    }
}
