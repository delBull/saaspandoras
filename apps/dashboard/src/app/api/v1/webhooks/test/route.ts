import { NextRequest, NextResponse } from "next/server";
import { integrationGuard } from "@/lib/integrations/guard";
import { validateWebhookDestinationUrl } from "@/lib/integrations/url-validator";
import { db } from "@saasfly/db-core";
import { integrationClients } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";

export const runtime = "nodejs";

/**
 * POST /api/v1/webhooks/test
 * Dispara un evento simulado de ping hacia el endpoint receptor del desarrollador.
 * Aplica validación Anti-SSRF estricta con DNS lookup antes del fetch.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await integrationGuard(req);

    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }

    const client = guard.client;

    const body = await req.json().catch(() => ({}));
    const targetUrl = body.targetUrl || client.callbackUrl;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json(
        { error: "INVALID_REQUEST: 'targetUrl' es requerido en el body o configurado en el cliente." },
        { status: 400 }
      );
    }

    // 1. Verificación de Seguridad Anti-SSRF (En webhooks salientes, NUNCA se permiten redes privadas ni metadata)
    const isProduction = client.environment === "production";
    const ssrfCheck = await validateWebhookDestinationUrl(targetUrl, {
      isProduction,
      allowLocalhostInDev: false, // Bloquear loopback y privados siempre para protección SSRF
    });

    if (!ssrfCheck.isValid) {
      return NextResponse.json(
        {
          error: "SSRF_REJECTED",
          message: `La URL de destino fue rechazada por la política de seguridad: ${ssrfCheck.error}`,
        },
        { status: 400 }
      );
    }

    // 2. Disparo de prueba
    const pingPayload = {
      event: "webhook.ping",
      timestamp: new Date().toISOString(),
      clientId: client.id,
      projectId: client.projectId,
      environment: client.environment,
      message: "Pandora's Growth OS — Webhook Connectivity Test Verified.",
    };

    const startTime = Date.now();
    let responseStatus: number;
    let responseBodyText = "";

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        redirect: "error", // Anti-SSRF: Rechazar redirects para evitar desvío a IPs privadas
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Pandoras-Webhook-Dispatcher/1.0",
          "X-Pandoras-Event": "webhook.ping",
          "X-Pandoras-Timestamp": String(Date.now()),
        },
        body: JSON.stringify(pingPayload),
        signal: AbortSignal.timeout(5000), // Timeout de 5s estricto
      });

      responseStatus = response.status;
      responseBodyText = await response.text().then(t => t.slice(0, 500)).catch(() => "");
    } catch (networkError: any) {
      return NextResponse.json({
        success: false,
        error: "DISPATCH_FAILED",
        targetUrl,
        message: networkError?.message || "No se pudo conectar con el endpoint remoto.",
        latencyMs: Date.now() - startTime,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: responseStatus >= 200 && responseStatus < 300,
      targetUrl,
      httpStatus: responseStatus,
      latencyMs: Date.now() - startTime,
      sampleResponse: responseBodyText,
      message: responseStatus >= 200 && responseStatus < 300
        ? "Webhook receptor respondió exitosamente."
        : `El webhook receptor respondió con código HTTP ${responseStatus}.`,
    });

  } catch (error: any) {
    console.error("❌ [WebhookTestAPI] Error:", error);
    return NextResponse.json({ error: error?.message || "Error al probar webhook." }, { status: 500 });
  }
}
