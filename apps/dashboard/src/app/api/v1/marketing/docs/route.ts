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
    const strategyPath = path.join(process.cwd(), "docs/MONETIZATION_MASTER_PLAN.md");
    const devGuidePath = path.join(process.cwd(), "docs/DEVELOPER_GUIDE_V2.md");
    
    let content = "";
    
    if (fs.existsSync(strategyPath)) {
      content += fs.readFileSync(strategyPath, "utf-8");
    }

    if (fs.existsSync(devGuidePath)) {
      content += "\n\n---\n\n" + fs.readFileSync(devGuidePath, "utf-8");
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
