import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectBriefings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Middleware checks (admin validation)
async function validateAdmin(req: NextRequest, projectId: number) {
  const walletAddress = req.headers.get("x-wallet-address")?.toLowerCase();
  
  if (!walletAddress) {
    return { authorized: false, error: "Unauthorized: Missing wallet address" };
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId)
  });

  if (!project) {
    return { authorized: false, error: "Project not found" };
  }

  const isCreator = project.applicantWalletAddress?.toLowerCase() === walletAddress;

  if (!isCreator) {
    return { authorized: false, error: "Unauthorized: You are not an admin of this project" };
  }

  return { authorized: true, project };
}

// GET all briefings for a project
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const projectId = Number(params.projectId);
    if (isNaN(projectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const auth = await validateAdmin(req, projectId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const briefingsList = await db.query.projectBriefings.findMany({
      where: eq(projectBriefings.projectId, projectId),
      orderBy: (pb, { desc }) => [desc(pb.createdAt)]
    });

    return NextResponse.json(briefingsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create or update a briefing
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const projectId = Number(params.projectId);
    if (isNaN(projectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const auth = await validateAdmin(req, projectId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { id, slug, title, subtitle, blocks, status, locale } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 });
    }

    const safeBlocks = Array.isArray(blocks) ? blocks : [];

    if (id) {
      // Update existing
      await db.update(projectBriefings)
        .set({
          slug,
          title,
          subtitle: subtitle || null,
          blocks: safeBlocks,
          status: status || 'published',
          locale: locale || 'es',
          updatedAt: new Date()
        })
        .where(and(
          eq(projectBriefings.id, Number(id)),
          eq(projectBriefings.projectId, projectId)
        ));

      return NextResponse.json({ success: true, message: "Briefing updated" });
    } else {
      // Create new
      await db.insert(projectBriefings).values({
        projectId,
        slug,
        title,
        subtitle: subtitle || null,
        blocks: safeBlocks,
        status: status || 'published',
        locale: locale || 'es',
      });

      return NextResponse.json({ success: true, message: "Briefing created" });
    }
  } catch (error: any) {
    console.error("Error saving briefing:", error);
    // Handle unique constraint on slug
    if (error.code === '23505') {
      return NextResponse.json({ error: "A briefing with this slug already exists for this project." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a briefing
export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const projectId = Number(params.projectId);
    if (isNaN(projectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const auth = await validateAdmin(req, projectId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing briefing ID" }, { status: 400 });

    await db.delete(projectBriefings).where(and(
      eq(projectBriefings.id, Number(id)),
      eq(projectBriefings.projectId, projectId)
    ));

    return NextResponse.json({ success: true, message: "Briefing deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
