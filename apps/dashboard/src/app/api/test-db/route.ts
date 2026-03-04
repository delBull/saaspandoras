
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log("🩺 Route hit: /api/test-db");
    try {
        console.log("🔍 [TestDB] Starting health check...");
        const start = Date.now();
        const result = await db.execute(sql`SELECT 1 as health`);
        const duration = Date.now() - start;

        return NextResponse.json({
            status: "ok",
            message: "Database is reachable",
            duration: `${duration}ms`,
            result
        });
    } catch (error: any) {
        console.error("❌ [TestDB] Error:", error);
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
