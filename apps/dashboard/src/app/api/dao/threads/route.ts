import { NextResponse } from "next/server";
import { db } from "~/db";
import { daoThreads } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

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

        // TODO: Verify signature/auth (skipped for MVP speed as per user preference for now, but should be added)

        const [newThread] = await db.insert(daoThreads).values({
            projectId: Number(projectId),
            authorAddress,
            title,
            category: category || 'general',
            isOfficial: isOfficial || false,
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
