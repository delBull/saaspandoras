import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema, projectDocuments as projectDocumentsSchema } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";

export const runtime = "nodejs";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
  "Access-Control-Max-Age": "86400",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/public/project/[slug]/documents
 * Retrieves project documents for the Transparency Center.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const apiKey = req.headers.get("x-api-key") || searchParams.get("apiKey");

    if (!apiKey) {
      return NextResponse.json({ error: "No se proporcionó API Key" }, { 
        status: 401,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    const authClient = await IntegrationKeyService.validateKey(apiKey);
    if (!authClient) {
      return NextResponse.json({ error: "API Key inválida o expirada" }, { 
        status: 401,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, slug),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { 
        status: 404,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    const documents = await db.query.projectDocuments.findMany({
      where: eq(projectDocumentsSchema.projectId, project.id),
      orderBy: desc(projectDocumentsSchema.updatedAt),
    });

    const response = NextResponse.json({
        projectId: project.id,
        slug: project.slug,
        documents: documents.map(doc => ({
            id: doc.id,
            title: doc.title,
            description: doc.description,
            documentType: doc.documentType,
            category: doc.category,
            status: doc.status,
            verificationStatus: doc.verificationStatus,
            visibility: doc.visibility,
            url: doc.fileUrl,
            storageProvider: doc.storageProvider,
            fileType: doc.fileType,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }))
    }, {
      headers: getCorsHeaders(req.headers.get("origin"))
    });

    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return response;

  } catch (error) {
    console.error("❌ Public Documents API Error:", error);
    return NextResponse.json({ 
      error: "Temporary data unavailability", 
      message: (error as Error).message 
    }, { 
      status: 500, 
      headers: getCorsHeaders(req.headers.get("origin"))
    });
  }
}
