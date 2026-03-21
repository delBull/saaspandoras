import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema, integrationClients } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { IntegrationKeyService } from "@/lib/integrations/auth";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/projects/[slug]/keys
 * Retrieves the API key fingerprint for a project.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.userId) || await isAdmin(session?.address);

    const { slug } = await params;
    const projectIdRaw = Number(slug);
    const isId = !isNaN(projectIdRaw);

    let project;
    if (isId) {
        project = await db.query.projects.findFirst({
            where: eq(projectsSchema.id, projectIdRaw),
            columns: { id: true, applicantWalletAddress: true }
        });
    } else {
        project = await db.query.projects.findFirst({
            where: eq(projectsSchema.slug, slug),
            columns: { id: true, applicantWalletAddress: true }
        });
    }

    if (!project) {
        return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Auth check: Admin or Project Owner
    const userWallet = (session?.address ?? session?.userId)?.toLowerCase();
    const isOwner = userWallet && project.applicantWalletAddress?.toLowerCase() === userWallet;

    if (!userIsAdmin && !isOwner) {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // Find integration client
    const client = await db.query.integrationClients.findFirst({
        where: and(
            eq(integrationClients.projectId, project.id),
            eq(integrationClients.environment, 'production'),
            eq(integrationClients.isActive, true),
            isNull(integrationClients.revokedAt)
        )
    });

    return NextResponse.json({
        projectId: project.id,
        slug: slug,
        apiKey: client ? client.keyFingerprint : null,
        hasKey: !!client
    });

  } catch (error) {
    console.error("❌ GET Keys Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/projects/[slug]/keys
 * Generates/Ensures an API key for a project.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const { session } = await getAuth(await headers());
        const userIsAdmin = await isAdmin(session?.userId) || await isAdmin(session?.address);
    
        const { slug } = await params;
        const projectIdRaw = Number(slug);
        const isId = !isNaN(projectIdRaw);
    
        let project;
        if (isId) {
            project = await db.query.projects.findFirst({
                where: eq(projectsSchema.id, projectIdRaw),
                columns: { id: true, title: true, applicantWalletAddress: true }
            });
        } else {
            project = await db.query.projects.findFirst({
                where: eq(projectsSchema.slug, slug),
                columns: { id: true, title: true, applicantWalletAddress: true }
            });
        }
    
        if (!project) {
            return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
        }
    
        // Auth check: Admin or Project Owner
        const userWallet = (session?.address ?? session?.userId)?.toLowerCase();
        const isOwner = userWallet && project.applicantWalletAddress?.toLowerCase() === userWallet;
    
        if (!userIsAdmin && !isOwner) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }
    
        const result = await IntegrationKeyService.ensureKeyForProject(
            project.id, 
            'production', 
            `Client: ${project.title}`
        );
    
        return NextResponse.json({
            message: result.isNew ? "API Key generada exitosamente" : "API Key recuperada",
            apiKey: result.key || result.fingerprint, // Return raw key only if newly created
            isNew: result.isNew
        });
    
      } catch (error) {
        console.error("❌ POST Keys Error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
      }
}
