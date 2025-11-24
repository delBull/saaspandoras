// API endpoint for managing custom shortlinks
// CRUD operations for admin shortlinks management

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and, or } from "drizzle-orm";
import { db } from "~/db";
import { getAuth, isAdmin } from "@/lib/auth";
import { shortlinks } from "~/db/schema";

export const dynamic = "force-dynamic";

// GET /api/admin/shortlinks - List all shortlinks
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "true";
    const showAllShortlinks = searchParams.get("show_all") === "true";

    // Log for debugging admin visibility issue - ALL ADMINS SEE ALL DATA
    console.log(`🔍 [SHORTLINKS] Admin ${session.userId} accessing ALL shortlinks globally (show_all: ${showAllShortlinks})`);

    // Build query
    const conditions = [];
    if (!includeInactive) {
      conditions.push(eq(shortlinks.isActive, true));
    }

    const result = await db
      .select({
        id: shortlinks.id,
        slug: shortlinks.slug,
        destinationUrl: shortlinks.destinationUrl,
        title: shortlinks.title,
        description: shortlinks.description,
        isActive: shortlinks.isActive,
        createdAt: shortlinks.createdAt,
        updatedAt: shortlinks.updatedAt,
        fullUrl: shortlinks.slug, // For frontend to construct full URL
      })
      .from(shortlinks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(shortlinks.createdAt));

    return NextResponse.json({ data: result });

  } catch (error) {
    console.error("Shortlinks list API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/shortlinks - Create new shortlink
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { session } = await getAuth(await headers());
    if (!session?.userId || !await isAdmin(session.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { slug, destinationUrl, title, description } = body;

    // Validation
    if (!slug || !destinationUrl) {
      return NextResponse.json(
        { error: "Slug and destination URL are required" },
        { status: 400 }
      );
    }

    // Clean slug (lowercase, no spaces/special chars)
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    if (cleanSlug !== slug) {
      return NextResponse.json(
        { error: `Slug must be lowercase with only letters, numbers, and hyphens. Suggested: ${cleanSlug}` },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existing = await db
      .select()
      .from(shortlinks)
      .where(eq(shortlinks.slug, cleanSlug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid destination URL format" },
        { status: 400 }
      );
    }

    // Create shortlink
    const result = await db
      .insert(shortlinks)
      .values({
        slug: cleanSlug,
        destinationUrl,
        title: title || null,
        description: description || null,
        createdBy: session.userId,
      })
      .returning();

    console.log(`📝 Created shortlink: /${cleanSlug} -> ${destinationUrl}`);

    return NextResponse.json({
      data: result[0],
      message: "Shortlink created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Shortlinks create API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
