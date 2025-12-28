import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "~/db";
import { daoThreads, projects } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSuperAdminWallet } from "~/lib/constants";
import { getAuth } from "~/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const threads = await db.select()
            .from(daoThreads)
            .where(eq(daoThreads.projectId, Number(projectId)))
            .orderBy(desc(daoThreads.isPinned), desc(daoThreads.isOfficial), desc(daoThreads.updatedAt));

        return NextResponse.json(threads);

    } catch (error) {
        console.error("Error fetching threads:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, authorAddress, title, category, isOfficial } = body;

        if (!projectId || !authorAddress || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify Auth
        const { session } = await getAuth(await headers());
        if (!session?.address || session.address.toLowerCase() !== authorAddress.toLowerCase()) {
            return NextResponse.json({ error: "Unauthorized: Invalid Session or Address Mismatch" }, { status: 401 });
        }

        // Check for Project Owner or Super Admin to auto-mark as Official
        const project = await db.query.projects.findFirst({
            columns: { applicantWalletAddress: true },
            where: eq(projects.id, Number(projectId)),
        });

        const isProjectOwner = project?.applicantWalletAddress?.toLowerCase() === authorAddress.toLowerCase();
        const superAdminWallet = getSuperAdminWallet();
        const isSuperAdmin = authorAddress.toLowerCase() === superAdminWallet.toLowerCase();

        // Auto-official if owner or super admin
        const shouldBeOfficial = isProjectOwner || isSuperAdmin || isOfficial;

        const [newThread] = await db.insert(daoThreads).values({
            projectId: Number(projectId),
            authorAddress,
            title,
            category: category || 'general',
            isOfficial: shouldBeOfficial,
        }).returning();

        if (!newThread) {
            return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
        }

        // Track Gamification Event
        try {
            const { GamificationService } = await import("~/lib/gamification/service");
            await GamificationService.trackEvent(authorAddress, 'forum_post', {
                threadId: newThread.id,
                projectId: Number(projectId),
                isThreadCreation: true
            });
        } catch (error) {
            console.error("Error tracking gamification event:", error);
        }

        return NextResponse.json(newThread);

    } catch (error) {
        console.error("Error creating thread:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
