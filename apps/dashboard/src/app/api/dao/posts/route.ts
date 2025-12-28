import { NextResponse } from "next/server";
import { db } from "~/db";
import { daoPosts, daoThreads } from "~/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const threadId = searchParams.get("threadId");

        if (!threadId) {
            return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
        }

        const posts = await db.select()
            .from(daoPosts)
            .where(eq(daoPosts.threadId, Number(threadId)))
            .orderBy(asc(daoPosts.createdAt));

        return NextResponse.json(posts);

    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { threadId, authorAddress, content } = body;

        if (!threadId || !authorAddress || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Transaction to insert post and update thread timestamp
        const newPost = await db.transaction(async (tx) => {
            const [post] = await tx.insert(daoPosts).values({
                threadId: Number(threadId),
                authorAddress,
                content,
            }).returning();

            // Update thread updated_at
            await tx.update(daoThreads)
                .set({ updatedAt: new Date() })
                .where(eq(daoThreads.id, Number(threadId)));

            return post;
        });

        if (!newPost) {
            return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
        }

        // Track Gamification Event
        try {
            const { GamificationService } = await import("~/lib/gamification/service");
            await GamificationService.trackEvent(authorAddress, 'forum_post', {
                threadId: Number(threadId),
                postId: newPost.id,
                isReply: true
            });
        } catch (error) {
            console.error("Error tracking gamification event:", error);
        }

        return NextResponse.json(newPost);

    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
