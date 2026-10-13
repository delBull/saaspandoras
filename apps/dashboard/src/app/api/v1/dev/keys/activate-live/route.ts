import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { projects as projectsSchema, installedProducts } from "@saasfly/db-core";
import { eq, and, inArray } from "@saasfly/db-core";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { IntegrationKeyService } from "@/lib/integrations/auth";

export const runtime = "nodejs";

/**
 * POST /api/v1/dev/keys/activate-live
 * Activa las credenciales LIVE (sk_live_... / pk_live_...) para un tenant desarrollador.
 * 
 * Directivas Constitucionales y de Seguridad (FC-011, FC-012):
 * 1. Solo se permite activación si el actor es el dueño legítimo o Superadmin.
 * 2. Transición server-authoritative e irreversible: pasa isSimulationMode de true a false.
 * 3. Emite de forma determinista credenciales en entorno 'production'.
 * 4. Las credenciales de staging/sandbox se mantienen intactas o pueden coexistir de forma aislada.
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = await getAuth(req.headers);
    const actorWallet = session?.address?.toLowerCase();

    if (!actorWallet) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Se requiere sesión autenticada con wallet para activar producción." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { slug, projectId: projectIdRaw } = body;

    let project;
    if (projectIdRaw && !isNaN(Number(projectIdRaw))) {
      project = await db.query.projects.findFirst({
        where: eq(projectsSchema.id, Number(projectIdRaw)),
        columns: { id: true, slug: true, title: true, applicantWalletAddress: true, isSimulationMode: true }
      });
    } else if (slug && typeof slug === "string") {
      project = await db.query.projects.findFirst({
        where: eq(projectsSchema.slug, slug),
        columns: { id: true, slug: true, title: true, applicantWalletAddress: true, isSimulationMode: true }
      });
    }

    if (!project) {
      return NextResponse.json({ error: "NOT_FOUND: Proyecto no encontrado." }, { status: 404 });
    }

    // Autorización: Dueño o Superadmin
    const userIsAdmin = await isAdmin(actorWallet);
    const isOwner = project.applicantWalletAddress?.toLowerCase() === actorWallet;

    if (!userIsAdmin && !isOwner) {
      return NextResponse.json(
        { error: "FORBIDDEN: No tienes autorización para activar entorno live en este proyecto." },
        { status: 403 }
      );
    }

    // 0. Entitlement Gate (Dictamen: NO emitir sk_live_ sin entitlement comercial válido)
    // Un plan comercial DEV_ACCESS (starter/growth/enterprise) en estado trial/active es requisito
    // para la transición simulación → producción. El plan `sandbox` no habilita entorno live.
    const entitlement = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.productFamily, "DEVELOPER"),
        eq(installedProducts.product, "DEV_ACCESS"),
        inArray(installedProducts.plan, ["starter", "growth", "enterprise"]),
        inArray(installedProducts.status, ["trial", "active"])
      ),
      columns: { id: true, plan: true, status: true },
    });

    if (!entitlement) {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED",
          message: "No se detectó un plan comercial DEV_ACCESS activo (starter/growth/enterprise) para este proyecto. La activación del entorno LIVE requiere una suscripción comercial válida; el plan sandbox solo permite claves de prueba (sk_test_).",
        },
        { status: 402 }
      );
    }

    // 1. Transición server-authoritative de simulación a producción
    if (project.isSimulationMode) {
      await db.update(projectsSchema)
        .set({ isSimulationMode: false })
        .where(eq(projectsSchema.id, project.id));
    }

    // Resolver capabilities autorizadas según el plan comercial (product-registry)
    const basePermissions = ["read", "deploy", "events:write"];
    if (entitlement.plan === "enterprise") {
      basePermissions.push("hermes_a2a");
    }

    // 2. Emisión segura de credenciales LIVE ('production')
    const secretResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "production",
      `Dev Live: ${project.title} (Secret)`,
      "secret",
      { forceRotate: false, permissions: basePermissions }
    );

    const publicKeyResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "production",
      `Dev Live: ${project.title} (Public)`,
      "public",
      { forceRotate: false, permissions: basePermissions }
    );

    return NextResponse.json({
      success: true,
      message: "Entorno productivo activado y credenciales live emitidas exitosamente.",
      tenant: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        environment: "production",
        isSimulationMode: false,
      },
      credentials: {
        environment: "production",
        secretKey: secretResult.key || secretResult.fingerprint,
        publicKey: publicKeyResult.key || publicKeyResult.fingerprint,
        isNew: secretResult.isNew || publicKeyResult.isNew,
      }
    });

  } catch (error: any) {
    console.error("❌ [DevActivateLiveAPI] Error:", error);
    return NextResponse.json({ error: error?.message || "Error al activar producción." }, { status: 500 });
  }
}
