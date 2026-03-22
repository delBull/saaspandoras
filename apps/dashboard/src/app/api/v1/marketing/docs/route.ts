import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

/**
 * Public endpoint to fetch marketing documentation for the Growth OS Landing.
 */
export async function GET() {
  const requestId = logger.generateRequestId();

  try {
    // In Vercel monorepo, process.cwd() is apps/dashboard
    const docPath = path.join(process.cwd(), "docs/MONETIZATION_MASTER_PLAN.md");
    
    let content = "";
    if (fs.existsSync(docPath)) {
      content = fs.readFileSync(docPath, "utf-8");
    } else {
      // Fallback: try from root if process.cwd() is different
      const rootPath = path.join(process.cwd(), "apps/dashboard/docs/MONETIZATION_MASTER_PLAN.md");
      if (fs.existsSync(rootPath)) {
        content = fs.readFileSync(rootPath, "utf-8");
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    logger.error({
      requestId,
      event: "PUBLIC_DOC_FETCH_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
