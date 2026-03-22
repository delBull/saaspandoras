import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { validateAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  const requestId = logger.generateRequestId();
  const userId = session!.userId;

  try {
    logger.info({
      requestId,
      userId,
      event: "GET_MONETIZATION_PLAN_START",
      path: "/api/admin/docs/monetization-plan"
    });
    // In Vercel monorepo, process.cwd() is apps/dashboard
    const docPath = path.join(process.cwd(), "docs/MONETIZATION_MASTER_PLAN.md");
    
    if (!fs.existsSync(docPath)) {
      // Fallback: try from root if process.cwd() is different
      const rootPath = path.join(process.cwd(), "apps/dashboard/docs/MONETIZATION_MASTER_PLAN.md");
      if (!fs.existsSync(rootPath)) {
          logger.error({
            requestId,
            userId,
            event: "DOC_NOT_FOUND",
            metadata: { docPath, rootPath }
          });
          return NextResponse.json({ error: "Document not found", requestId }, { status: 404 });
      }
      const content = fs.readFileSync(rootPath, "utf-8");
      logger.info({
        requestId,
        userId,
        event: "GET_MONETIZATION_PLAN_SUCCESS"
      });
      return NextResponse.json({ content });
    }

    const content = fs.readFileSync(docPath, "utf-8");
    logger.info({
      requestId,
      userId,
      event: "GET_MONETIZATION_PLAN_SUCCESS"
    });
    return NextResponse.json({ content });
  } catch (error) {
    logger.error({
      requestId,
      userId,
      event: "GET_MONETIZATION_PLAN_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Internal Server Error", requestId }, { status: 500 });
  }
}
