import { NextRequest, NextResponse } from 'next/server';
import {
  CapabilityGrantService,
  HermesMediaOrchestratorService,
  buildRateLimitHeaders,
  checkTenantRateLimit,
  type MediaProviderOption,
} from '@saasfly/hermes-core';
import { authorizeContentClient, resolveContentCapability } from '@/lib/content/tenant-authority';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Generación de imagen (~20 s) + cold start del worker: el default de Vercel
// (10-60 s) aborta antes de que RunPod termine.
export const maxDuration = 300;

/**
 * POST /api/v1/content/jobs
 *
 * Crea (o recupera por idempotencia) un job real de producción de contenido y lo
 * ejecuta con el orquestador de media (Sofia → RunPod).
 *
 * Auth: Authorization: Bearer sk_live_…  (permiso `content.asset.create`)
 * Tenant: se resuelve desde la API key, nunca del body.
 *
 * Body:
 *   { "title": "Video Pitch Q3", "type": "video_render",
 *     "parameters": { "duration": 60, "script": "..." },
 *     "provider": "auto" | "sofia" | "runpod",
 *     "wait": true, "idempotencyKey": "..." }
 *
 * `wait` (default true) devuelve el resultado real de la generación. Con
 * `wait=false` responde 202 y el job se ejecuta en segundo plano; se consulta con
 * GET /api/v1/content/jobs/:jobId.
 */

const RESERVED_FIELDS = new Set([
  'tenantid',
  'capability',
  'prompt',
  'protocol',
  'version',
  'messageid',
  'correlationid',
  'requestid',
  'nonce',
  'security',
  'endpointid',
]);

const PROVIDERS: MediaProviderOption[] = ['auto', 'sofia', 'runpod'];

interface JobBody {
  title?: unknown;
  type?: unknown;
  parameters?: unknown;
  prompt?: unknown;
  provider?: unknown;
  wait?: unknown;
  idempotencyKey?: unknown;
  endpointId?: unknown;
}

export async function POST(req: NextRequest) {
  const auth = await authorizeContentClient(req, ['content.asset.create']);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }
  const { client } = auth;

  let body: JobBody = {};
  try {
    body = (await req.json()) as JobBody;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 2 || title.length > 200) {
    return NextResponse.json(
      { success: false, error: 'title is required (2-200 chars).' },
      { status: 422 }
    );
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const capability = resolveContentCapability(type);
  if (!capability) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported content type '${type}'.`,
        allowedTypes: [
          'image',
          'image_render',
          'poster',
          'video',
          'video_render',
          'reel',
          'copy',
          'copy_render',
          'caption',
          'editorial',
          'newsletter',
          'audio',
          'podcast',
          'research',
          'research_report',
        ],
      },
      { status: 422 }
    );
  }

  const parameters =
    body.parameters !== null && typeof body.parameters === 'object'
      ? (body.parameters as Record<string, unknown>)
      : {};

  const explicitPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const parameterPrompt =
    typeof parameters.script === 'string'
      ? parameters.script
      : typeof parameters.prompt === 'string'
        ? parameters.prompt
        : '';
  const prompt = (explicitPrompt || parameterPrompt || title).slice(0, 8000);

  // Endpoint de cómputo por job (RunPod). Se resuelve antes del proveedor para
  // poder inferirlo: si el cliente manda endpointId sin `provider`, es runpod.
  const endpointFromBody = typeof body.endpointId === 'string' ? body.endpointId.trim() : '';
  const endpointFromParams =
    typeof parameters.endpointId === 'string' ? String(parameters.endpointId).trim() : '';
  const endpointId = endpointFromBody || endpointFromParams || undefined;

  if (endpointId && !/^[A-Za-z0-9]{6,64}$/.test(endpointId)) {
    return NextResponse.json(
      { success: false, error: "endpointId inválido: usa el Endpoint ID de RunPod (alfanumérico)." },
      { status: 422 }
    );
  }

  // Proveedor por defecto: SOFÍA (la ruta de media operativa). `runpod` sólo
  // cuando se pide explícitamente o se envía un endpointId.
  const providerInput =
    typeof body.provider === 'string' ? body.provider : endpointId ? 'runpod' : 'sofia';
  if (!PROVIDERS.includes(providerInput as MediaProviderOption)) {
    return NextResponse.json(
      { success: false, error: `Invalid provider '${providerInput}'. Allowed: auto, sofia, runpod.` },
      { status: 422 }
    );
  }
  const provider = providerInput as MediaProviderOption;

  // Opciones: se descartan campos de protocolo que no puede fijar el cliente.
  const options: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (RESERVED_FIELDS.has(key.toLowerCase())) continue;
    options[key] = value;
  }

  const headerIdempotency = req.headers.get('idempotency-key') ?? undefined;
  const bodyIdempotency = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
  const idempotencyCandidate =
    headerIdempotency && headerIdempotency.length > 0 ? headerIdempotency : bodyIdempotency;
  const idempotencyKey = idempotencyCandidate ? idempotencyCandidate.slice(0, 200) : undefined;

  // Anti-abuso: la generación tiene costo.
  const rateLimit = checkTenantRateLimit(client.canonicalOrgId, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Límite de generación por minuto excedido para este tenant.',
        retryAfter: rateLimit.retryAfterSeconds,
      },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  // Plan mensual vencido sin regularizar ⇒ solo lectura (la generación se bloquea).
  // El pago del plan es independiente del saldo de créditos.
  try {
    const { getOrCreateSubscription } = await import('@/lib/billing/subscription');
    const subscription = await getOrCreateSubscription(client.tenantId);
    if (subscription?.state.isReadOnly) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tu plan mensual está suspendido (solo lectura). Regulariza el plan para volver a generar.',
          code: 'SUBSCRIPTION_SUSPENDED',
          planStatus: subscription.state.status,
        },
        { status: 402 }
      );
    }
  } catch (error: unknown) {
    // No bloquear por un fallo leyendo la suscripción; se registra para revisión.
    console.error('[ContentAPI] Subscription check failed:', error);
  }

  // El tenant debe tener la capability habilitada (governance de Hermes).
  const isGranted = await CapabilityGrantService.isCapabilityGranted(client.tenantId, capability).catch(
    () => false
  );
  if (!isGranted) {
    return NextResponse.json(
      {
        success: false,
        error: `Capability '${capability}' is not granted for tenant '${client.tenantId}'.`,
        code: 'CAPABILITY_NOT_GRANTED',
      },
      { status: 403 }
    );
  }

  const hasDefaultEndpoint = Boolean(process.env.RUNPOD_DEFAULT_ENDPOINT?.trim());
  // Sólo RunPod explícito exige endpoint. `auto` intenta Sofía primero.
  if (provider === 'runpod' && !endpointId && !hasDefaultEndpoint) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Falta el endpoint de cómputo: envía "endpointId" (Endpoint ID de RunPod) en el body o configura RUNPOD_DEFAULT_ENDPOINT.',
        code: 'RUNPOD_ENDPOINT_REQUIRED',
      },
      { status: 422 }
    );
  }

  const wait = body.wait === undefined ? true : body.wait === true;

  try {
    // El orquestador tipa `request` como any; lo acotamos aquí para no propagar `any`.
    const created: { request: { id: string; status: string }; isNew: boolean } =
      await HermesMediaOrchestratorService.createOrGetMediaRequest(client.tenantId, {
        capability,
        prompt,
        options,
        provider,
        idempotencyKey,
        endpointId,
        isSandbox: false,
        actorId: `integration_client:${client.clientId}`,
      });
    const { request, isNew } = created;

    if (!wait) {
      // Ejecución en segundo plano; el cliente consulta el job.
      void HermesMediaOrchestratorService.executeGeneration(client.tenantId, request.id, {
        capability,
        prompt,
        options,
        provider,
        idempotencyKey,
        endpointId,
        isSandbox: false,
        actorId: `integration_client:${client.clientId}`,
      }).catch((error: unknown) => {
        console.error(`[ContentAPI] Async generation failed for ${request.id}:`, error);
      });

      return NextResponse.json(
        {
          success: true,
          jobId: request.id,
          status: request.status,
          provider,
          capability,
          title,
          idempotentReplay: !isNew,
          message: 'Job registrado. Consulta GET /api/v1/content/jobs/:jobId para el estado.',
        },
        { status: 202 }
      );
    }

    const result = await HermesMediaOrchestratorService.executeGeneration(client.tenantId, request.id, {
      capability,
      prompt,
      options,
      provider,
      idempotencyKey,
      endpointId,
      isSandbox: false,
      actorId: `integration_client:${client.clientId}`,
    });

    // Mapeo explícito: no todo fallo es un error del servidor.
    //  - 402: el tenant no tiene saldo (no reintentar igual, hay que recargar)
    //  - 403: capability no otorgada (governance)
    //  - 504: resultado desconocido (Sofía no confirmó)
    const httpStatus = result.ok
      ? 200
      : result.failureCode === 'INSUFFICIENT_CREDITS'
        ? 402
        : result.failureCode === 'CAPABILITY_NOT_GRANTED'
          ? 403
          : result.status === 'UNKNOWN'
            ? 504
            : 500;

    return NextResponse.json(
      {
        success: result.ok,
        jobId: request.id,
        status: result.status,
        code: result.ok ? undefined : result.failureCode ?? null,
        provider: result.provider,
        attemptCount: result.attemptCount,
        artifactId: result.artifactId ?? null,
        artifact: result.artifact ?? null,
        financialBreakdown: result.financialBreakdown ?? null,
        idempotentReplay: !isNew || Boolean(result.isIdempotentReplay),
        error: result.error ?? null,
      },
      { status: httpStatus }
    );
  } catch (error: unknown) {
    console.error('[ContentAPI] POST /jobs failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error creating job.' },
      { status: 500 }
    );
  }
}
