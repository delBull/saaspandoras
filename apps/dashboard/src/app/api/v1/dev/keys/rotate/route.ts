import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@saasfly/db-core";
import { projects as projectsSchema } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { IntegrationKeyService } from "@/lib/integrations/auth";

export const runtime = "nodejs";

/**
 * POST /api/v1/dev/keys/rotate
 * Rota o revoca de forma determinista las credenciales del entorno sandbox/desarrollador.
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = await getAuth(req.headers);
    const actorWallet = session?.address?.toLowerCase();

    if (!actorWallet) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Sesión o wallet requerida para rotar credenciales." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { slug, projectId: projectIdRaw } = body;

    let project;
    if (projectIdRaw && !isNaN(Number(projectIdRaw))) {
      project = await db.query.projects.findFirst({
        where: eq(projectsSchema.id, Number(projectIdRaw)),
        columns: { id: true, slug: true, title: true, applicantWalletAddress: true }
      });
    } else if (slug && typeof slug === "string") {
      project = await db.query.projects.findFirst({
        where: eq(projectsSchema.slug, slug),
        columns: { id: true, slug: true, title: true, applicantWalletAddress: true }
      });
    }

    if (!project) {
      return NextResponse.json({ error: "NOT_FOUND: Proyecto no encontrado." }, { status: 404 });
    }

    // Autorización: Debe ser el dueño registrado o Superadmin
    const userIsAdmin = await isAdmin(actorWallet);
    const isOwner = project.applicantWalletAddress?.toLowerCase() === actorWallet;

    if (!userIsAdmin && !isOwner) {
      return NextResponse.json(
        { error: "FORBIDDEN: No tienes permisos para rotar credenciales de esta organización." },
        { status: 403 }
      );
    }

    // Rotar claves en sandbox (entorno 'staging')
    const secretResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "staging",
      `Dev Sandbox: ${project.title} (Secret - Rotated)`,
      "secret",
      { forceRotate: true }
    );

    const publicKeyResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "staging",
      `Dev Sandbox: ${project.title} (Public - Rotated)`,
      "public",
      { forceRotate: true }
    );

    return NextResponse.json({
      success: true,
      message: "Credenciales sandbox rotadas exitosamente. Las credenciales anteriores han sido revocadas inmediatamente.",
      tenant: {
        id: project.id,
        slug: project.slug,
        title: project.title,
      },
      credentials: {
        environment: "sandbox",
        secretKey: secretResult.key,
        publicKey: publicKeyResult.key,
        isNew: true,
        rotatedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error("❌ [DevKeysRotateAPI] Error:", error);
    return NextResponse.json({ error: error?.message || "Error al rotar credenciales." }, { status: 500 });
  }
}
