import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema, integrationClients } from "@/db/schema";
import { eq, and, isNull, like } from "drizzle-orm";
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

    // Determine Environment
    const env = (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_URL?.includes('staging')) ? 'staging' : 'production';

    // 1. Get Public Key Client
    const publicClient = await db.query.integrationClients.findFirst({
        where: and(
            eq(integrationClients.projectId, project.id),
            eq(integrationClients.environment, env),
            eq(integrationClients.isActive, true),
            isNull(integrationClients.revokedAt),
            like(integrationClients.keyFingerprint, 'pk_%')
        )
    });

    // 2. Get Secret Key Client
    const secretClient = await db.query.integrationClients.findFirst({
        where: and(
            eq(integrationClients.projectId, project.id),
            eq(integrationClients.environment, env),
            eq(integrationClients.isActive, true),
            isNull(integrationClients.revokedAt),
            like(integrationClients.keyFingerprint, 'sk_%')
        )
    });

    return NextResponse.json({
        projectId: project.id,
        slug: slug,
        environment: env,
        publicKey: publicClient ? publicClient.keyFingerprint : null,
        secretKey: secretClient ? secretClient.keyFingerprint : null,
        hasKeys: !!publicClient || !!secretClient
    });

  } catch (error) {
    console.error("❌ GET Keys Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/projects/[slug]/keys
 * Generates/Ensures BOTH an API key and a Secret key for a project.
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
        
        const env = (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_URL?.includes('staging')) ? 'staging' : 'production';
    
        const publicResult = await IntegrationKeyService.ensureKeyForProject(
            project.id, 
            env, 
            `Client: ${project.title} (Public)`,
            'public'
        );

        const secretResult = await IntegrationKeyService.ensureKeyForProject(
            project.id, 
            env, 
            `Client: ${project.title} (Secret)`,
            'secret'
        );
    
        return NextResponse.json({
            message: "API Keys verificadas/generadas exitosamente",
            environment: env,
            publicKey: publicResult.key || publicResult.fingerprint,
            secretKey: secretResult.key || secretResult.fingerprint,
            isNew: publicResult.isNew || secretResult.isNew
        });
    
      } catch (error) {
        console.error("❌ POST Keys Error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
      }
}

