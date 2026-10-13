import { NextRequest, NextResponse } from "next/server";
import { getAuth, isAdmin } from "@saasfly/auth-sdk";
import { db } from "@saasfly/db-core";
import { projects as projectsSchema, integrationClients } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";
import { validateWebhookDestinationUrl } from "@/lib/integrations/url-validator";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/v1/dev/webhooks/config
 * Configura o actualiza la URL de webhook y genera/rota el secreto HMAC para un tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const { session } = await getAuth(req.headers);
    const actorWallet = session?.address?.toLowerCase();

    if (!actorWallet) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Sesión o wallet requerida para configurar webhooks." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { slug, projectId: rawProjectId, callbackUrl, rotateSecret } = body;

    let project;
    if (rawProjectId && !isNaN(Number(rawProjectId))) {
      project = await db.query.projects.findFirst({
        where: eq(projectsSchema.id, Number(rawProjectId)),
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

    const userIsAdmin = await isAdmin(actorWallet);
    const isOwner = project.applicantWalletAddress?.toLowerCase() === actorWallet;

    if (!userIsAdmin && !isOwner) {
      return NextResponse.json(
        { error: "FORBIDDEN: No tienes permisos para configurar webhooks en este proyecto." },
        { status: 403 }
      );
    }

    // 1. Validación de la URL de webhook con Anti-SSRF
    if (callbackUrl !== undefined && callbackUrl !== null && callbackUrl !== "") {
      const isProduction = !project.isSimulationMode;
      const ssrfCheck = await validateWebhookDestinationUrl(callbackUrl, {
        isProduction,
        allowLocalhostInDev: false, // Siempre bloquear destinos privados y metadata
      });

      if (!ssrfCheck.isValid) {
        return NextResponse.json(
          { error: `SSRF_REJECTED: La URL provista fue rechazada: ${ssrfCheck.error}` },
          { status: 400 }
        );
      }
    }

    // 2. Buscar cliente de integración activo para este proyecto
    const env = project.isSimulationMode ? "staging" : "production";
    const client = await db.query.integrationClients.findFirst({
      where: and(
        eq(integrationClients.projectId, project.id),
        eq(integrationClients.environment, env),
        eq(integrationClients.isActive, true)
      ),
      columns: { id: true, callbackUrl: true, callbackSecretHash: true }
    });

    if (!client) {
      return NextResponse.json(
        { error: "NO_ACTIVE_CLIENT: Debe generar o inicializar credenciales antes de configurar webhooks." },
        { status: 404 }
      );
    }

    // 3. Generar nuevo secret HMAC si se solicita o si no existe
    let rawSecret: string | null = null;
    let newSecretHash: string = client.callbackSecretHash || "";

    if (rotateSecret || !client.callbackSecretHash) {
      rawSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
      newSecretHash = rawSecret;
    }

    // 4. Actualizar cliente
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (callbackUrl !== undefined) {
      updateData.callbackUrl = callbackUrl || null;
    }

    if (newSecretHash) {
      updateData.callbackSecretHash = newSecretHash;
    }

    await db.update(integrationClients)
      .set(updateData)
      .where(eq(integrationClients.id, client.id));

    return NextResponse.json({
      success: true,
      message: "Configuración de webhooks actualizada exitosamente.",
      webhook: {
        callbackUrl: callbackUrl !== undefined ? callbackUrl : client.callbackUrl,
        environment: env,
        // El rawSecret solo se muestra cuando fue recién generado o rotado
        secret: rawSecret || (client.callbackSecretHash ? "whsec_••••••••••••••••••••••••••••••••" : null),
        isSecretNew: !!rawSecret,
      }
    });

  } catch (error: any) {
    console.error("❌ [DevWebhooksConfigAPI] Error:", error);
    return NextResponse.json({ error: error?.message || "Error al configurar webhooks." }, { status: 500 });
  }
}
