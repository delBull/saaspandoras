import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { validateAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  const requestId = logger.generateRequestId();
  const userId = session!.userId;

  try {
    // Path to the roadmap in the root of the monorepo
    // process.cwd() is apps/dashboard
    const docPath = path.join(process.cwd(), "../../MARKETING_GROWTH_OS_ROADMAP.md");
    
    if (!fs.existsSync(docPath)) {
      // Fallback if the path structure is different (e.g. Vercel deployment)
      const rootPath = path.join(process.cwd(), "MARKETING_GROWTH_OS_ROADMAP.md");
      if (!fs.existsSync(rootPath)) {
          return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
      }
      const content = fs.readFileSync(rootPath, "utf-8");
      return NextResponse.json({ content });
    }

    const content = fs.readFileSync(docPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
