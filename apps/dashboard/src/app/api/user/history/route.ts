import { NextResponse } from "next/server";
import { db } from "~/db";
import { gamificationEvents, users, actionLogs, projects } from "~/db/schema";
import { eq, desc, or, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet");
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

        if (!wallet) {
            return NextResponse.json({ error: "Wallet required" }, { status: 400 });
        }

        const user = await db.select({ id: users.id }).from(users).where(eq(users.walletAddress, wallet.toLowerCase())).limit(1);
        const userId = (user && user.length > 0) ? user[0]?.id : null;

        // 1. Fetch Gamification Events (Only if user exists)
        let gEvents: any[] = [];
        if (userId) {
            gEvents = await db.select()
                .from(gamificationEvents)
                .where(eq(gamificationEvents.userId, userId))
                .orderBy(desc(gamificationEvents.createdAt))
                .limit(limit);
        }

        // 2. Fetch Action Logs (Purchases, Mints) - Can be by userId OR wallet
        const aLogs = await db.select({
            id: actionLogs.id,
            type: actionLogs.actionType,
            createdAt: actionLogs.createdAt,
            metadata: actionLogs.metadata,
            protocolName: projects.title
        })
        .from(actionLogs)
        .leftJoin(projects, eq(actionLogs.protocolId, projects.id))
        .where(
            userId 
                ? or(eq(actionLogs.userId, userId), eq(actionLogs.userId, wallet.toLowerCase()))
                : eq(actionLogs.userId, wallet.toLowerCase())
        )
        .orderBy(desc(actionLogs.createdAt))
        .limit(limit);

        // 3. Unify and Sort
        const unified = [
            ...gEvents.map(e => ({
                id: `g_${e.id}`,
                type: e.type,
                description: e.metadata ? (e.metadata as any).description : "",
                points: e.points,
                createdAt: e.createdAt,
                source: 'gamification'
            })),
            ...aLogs.map(a => ({
                id: `a_${a.id}`,
                type: a.type,
                description: a.protocolName ? `Interacción con ${a.protocolName}` : "",
                points: 0,
                createdAt: a.createdAt,
                source: 'action_log'
            }))
        ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

        return NextResponse.json({ events: unified });

    } catch (error) {
        console.error("Error fetching user history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
