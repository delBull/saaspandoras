import { NextResponse } from 'next/server';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { provisionTenant, TenantProvisioningError } from '@/lib/platform/tenant-provisioning';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/integrations/tenants/provision
 *
 * Alta completa de un tenant por API (self-serve desde los developer docs):
 * proyecto + dueño (email) + usuario del Portal + HERMES instalado + créditos
 * + API key S2S + capability grants.
 *
 * Auth: `Authorization: Bearer <sk_live>` con permiso `tenant.provision`.
 *
 * Body: { name, slug, ownerEmail, products?: string[], capabilities?: string[] }
 *   `products` acepta HERMES | GROWTH_OS | TOKENIZATION | MEDIA_CO (alias: RWA,
 *   HERMES_OS, MEDIA). Si se omite ⇒ ['HERMES'].
 *
 * Respuesta:
 *   { tenant, apiKey, portalUrl, products, productEntries, ... }
 *   ← `apiKey` se muestra UNA sola vez
 *
 * Antes esta ruta sólo creaba la fila de `projects`, así que el tenant quedaba
 * sin email, sin usuario y sin key propia: no podía entrar al Portal ni llamar
 * a la Content API.
 */
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const permissions = (client.permissions as string[]) || [];
    if (!permissions.includes('tenant.provision')) {
      return NextResponse.json(
        { error: 'Missing required permission: tenant.provision' },
        { status: 403 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name : '';
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail : '';
    const description = typeof body.description === 'string' ? body.description : undefined;
    const capabilities = Array.isArray(body.capabilities)
      ? body.capabilities.filter((c): c is string => typeof c === 'string')
      : undefined;
    const products = Array.isArray(body.products)
      ? body.products.filter((c): c is string => typeof c === 'string')
      : undefined;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }
    if (!ownerEmail) {
      return NextResponse.json(
        {
          error: 'ownerEmail es obligatorio: sin email el tenant no puede entrar al Portal.',
          code: 'OWNER_EMAIL_REQUIRED',
        },
        { status: 400 }
      );
    }

    const result = await provisionTenant({
      name,
      slug,
      ownerEmail,
      description,
      products,
      capabilities,
      actor: `integration_client:${client.id}`,
    });

    return NextResponse.json(
      {
        success: true,
        tenant: {
          projectId: result.projectId,
          slug: result.slug,
          ownerEmail: result.ownerEmail,
        },
        // Se muestra UNA sola vez: no se puede recuperar después.
        apiKey: result.apiKey,
        keyFingerprint: result.keyFingerprint,
        permissions: result.permissions,
        capabilities: result.capabilities,
        products: result.products ?? [],
        productEntries: result.productEntries ?? [],
        credits: result.credits,
        // Hub del tenant: desde aquí entra a cualquier producto instalado.
        portalUrl: result.portalUrl,
        next: {
          step1: `Abre ${result.portalUrl} e inicia sesión con ${result.ownerEmail} (enlace mágico, sin contraseña). Verás solo los productos instalados: ${(result.products ?? []).join(', ') || 'HERMES'}.`,
          step2: 'Recarga saldo (tarjeta o USDC, mínimo $10) desde el Media Studio.',
          step3: 'Guarda la apiKey ahora: no se vuelve a mostrar. Úsala como Authorization: Bearer.',
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof TenantProvisioningError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('[TenantProvision] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
