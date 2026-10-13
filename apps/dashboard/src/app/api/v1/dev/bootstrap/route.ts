import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@saasfly/db-core";
import { projects as projectsSchema } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { TenantProvisioningService } from "@saasfly/shared";

export const runtime = "nodejs";

/**
 * POST /api/v1/dev/bootstrap
 * Provisiona un entorno sandbox de desarrollador (DEV_ACCESS) y emite credenciales seguras.
 * 
 * Reglas de Autorización & Seguridad:
 * 1. Actor autenticado vía sesión/wallet o superadmin.
 * 2. Creación forzada en entorno sandbox / isSimulationMode: true.
 * 3. Emisión estricta de credenciales sk_test_... (nunca credenciales live).
 * 4. Idempotente: Si el proyecto ya pertenece a la identidad conectada, recupera o rota llaves.
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = await getAuth(req.headers);
    const actorWallet = session?.address?.toLowerCase();

    if (!actorWallet) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Sesión o wallet conectada requerida para auto-aprovisionar sandbox." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { organizationName, slug, rotateKeys } = body;

    if (!organizationName || typeof organizationName !== "string" || organizationName.trim().length === 0) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: 'organizationName' es requerido." },
        { status: 400 }
      );
    }

    const provisioningService = new TenantProvisioningService();
    const cleanSlug = provisioningService.sanitizeSlug(slug || organizationName);

    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json(
        { error: "INVALID_SLUG: El slug debe tener al menos 2 caracteres alfanuméricos válidos." },
        { status: 400 }
      );
    }

    // 1. Provisionar o vincular identidad de tenant vía contrato canónico
    const provisionResult = await provisioningService.provisionTenant(
      {
        organization: {
          name: organizationName.trim(),
          slug: cleanSlug,
          description: `Headless Developer Sandbox: ${organizationName.trim()}`,
          businessCategory: "tech_startup",
        },
        products: ["DEV_ACCESS"],
        idempotencyKey: `dev_bootstrap_${cleanSlug}_${actorWallet}`,
      },
      actorWallet
    );

    // 2. Resolver proyecto numérico
    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, cleanSlug),
      columns: { id: true, slug: true, title: true, applicantWalletAddress: true, isSimulationMode: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: "PROVISIONING_FAILED: No se pudo resolver el proyecto aprovisionado." },
        { status: 500 }
      );
    }

    // 3. Emisión segura de credenciales de prueba (sk_test_... y pk_test_...)
    // El entorno dev/sandbox SIEMPRE utiliza 'staging' para emitir llaves de prueba
    const forceRotate = rotateKeys === true;

    const secretKeyResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "staging",
      `Dev Sandbox: ${project.title} (Secret)`,
      "secret",
      { forceRotate }
    );

    const publicKeyResult = await IntegrationKeyService.ensureKeyForProject(
      project.id,
      "staging",
      `Dev Sandbox: ${project.title} (Public)`,
      "public",
      { forceRotate }
    );

    return NextResponse.json({
      success: true,
      message: forceRotate ? "Credenciales sandbox rotadas exitosamente." : "Entorno sandbox aprovisionado exitosamente.",
      tenant: {
        id: project.id,
        slug: project.slug,
        name: project.title,
        environment: "sandbox",
        isSimulationMode: project.isSimulationMode,
      },
      credentials: {
        environment: "sandbox",
        // La clave secreta solo se muestra completa en su creación/rotación (isNew), de lo contrario fingerprint
        secretKey: secretKeyResult.key || secretKeyResult.fingerprint,
        publicKey: publicKeyResult.key || publicKeyResult.fingerprint,
        isNew: secretKeyResult.isNew || publicKeyResult.isNew,
      },
      endpoints: {
        events: `/api/v1/integrations/events`,
        leads: `/api/v1/leads/status`,
        webhooksTest: `/api/v1/webhooks/test`,
      },
    });

  } catch (error: any) {
    console.error("❌ [DevBootstrapAPI] Error:", error);
    const message = error?.message || "Error interno al aprovisionar sandbox.";
    const status = message.includes("TENANT_SLUG_CONFLICT") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
