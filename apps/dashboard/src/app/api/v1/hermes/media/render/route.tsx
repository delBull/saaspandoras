import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { uploadTenantAsset } from '@/lib/media/tenant-assets';
import { buildTemplateElement, TEMPLATE_IDS, type TemplateId } from '@/lib/media/render/templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🎨 Motor de plantillas de media (ADR-020 §2.3-bis)
 *
 * Genera el PNG de una pieza con la identidad del tenant y lo deja en la
 * biblioteca (Vercel Blob) devolviendo su URL pública. Así la publicación sólo
 * referencia la URL, como exige Instagram.
 *
 * Identidad: sale del brand kit del tenant (`projects.tenantRuntimeConfig.brandConfig`).
 * Nada de colores fijos por marca en el código.
 */


interface RenderRequest {
  template?: unknown;
  kicker?: unknown;
  lines?: unknown;
  goldLine?: unknown;
  body?: unknown;
  imageUrl?: unknown;
  ctaLabel?: unknown;
  phone?: unknown;
  format?: unknown;
  title?: unknown;
}

interface BrandKit {
  background: string;
  gold: string;
  text: string;
  muted: string;
  logoUrl: string | null;
  name: string;
}

const DEFAULTS: BrandKit = {
  background: '#0A151F',
  gold: '#C99960',
  text: '#F5F2EA',
  muted: '#9FB0C0',
  logoUrl: null,
  name: "S'Narai",
};

function pickBrand(kit: Record<string, any> | null | undefined): BrandKit {
  const bg = typeof kit?.background === 'string' ? kit.background : DEFAULTS.background;
  return {
    background: bg,
    gold: typeof kit?.color === 'string' ? kit.color : DEFAULTS.gold,
    text: typeof kit?.textColor === 'string' ? kit.textColor : DEFAULTS.text,
    muted: '#9FB0C0',
    logoUrl: typeof kit?.logoUrl === 'string' && /^https:\/\//.test(kit.logoUrl) ? kit.logoUrl : null,
    name: typeof kit?.name === 'string' ? kit.name : DEFAULTS.name,
  };
}

const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(origin: string, file: string): Promise<ArrayBuffer> {
  const key = `${origin}/${file}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const res = await fetch(key, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`No se pudo cargar la fuente ${file} (${res.status})`);
  const buffer = await res.arrayBuffer();
  fontCache.set(key, buffer);
  return buffer;
}

function LogoRow({ brand }: { brand: BrandKit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" width={54} height={54} style={{ objectFit: 'contain' }} />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 26, letterSpacing: 10, color: brand.text, fontFamily: 'Inter' }}>
          S’NARAI
        </span>
        <span style={{ fontSize: 13, letterSpacing: 6, color: brand.muted, fontFamily: 'Inter' }}>
          RIVIERA NAYARIT
        </span>
      </div>
    </div>
  );
}

function Kicker({ text, brand }: { text: string; brand: BrandKit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', width: 56, height: 2, backgroundColor: brand.gold }} />
      <span style={{ fontSize: 20, letterSpacing: 3, color: brand.muted, fontFamily: 'Inter' }}>
        {text}
      </span>
    </div>
  );
}

function Title({
  lines,
  goldLine,
  brand,
  size,
}: {
  lines: string[];
  goldLine: number | null;
  brand: BrandKit;
  size: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          style={{
            fontFamily: 'Playfair',
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.04,
            color: index === goldLine ? brand.gold : brand.text,
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RenderRequest;

    const template = String(body.template || 'cover') as TemplateId;
    if (!TEMPLATE_IDS.includes(template)) {
      return NextResponse.json({ error: `Plantilla desconocida. Usa: ${TEMPLATE_IDS.join(', ')}` }, { status: 400 });
    }

    const rawLines = Array.isArray(body.lines)
      ? body.lines
      : typeof body.title === 'string'
        ? body.title.split('\n')
        : [];
    const lines = rawLines.map((line) => String(line)).filter((line) => line.trim().length > 0).slice(0, 4);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'Falta el texto: envía `lines` (array de líneas).' }, { status: 400 });
    }

    const kicker = typeof body.kicker === 'string' ? body.kicker.slice(0, 80) : null;
    const bodyText = typeof body.body === 'string' ? body.body.slice(0, 420) : null;
    const imageUrl = typeof body.imageUrl === 'string' && /^https:\/\//.test(body.imageUrl) ? body.imageUrl : null;
    const goldLine = Number.isInteger(body.goldLine) ? Number(body.goldLine) : null;
    const format = body.format === 'feed' ? 'feed' : 'portrait';
    const width = 1080;
    const height = format === 'feed' ? 1080 : 1350;

    if (template === 'cover' && !imageUrl) {
      return NextResponse.json({ error: 'La plantilla cover necesita `imageUrl`.' }, { status: 400 });
    }

    // Autoridad: la organización sale de la sesión del portal.
    const requested = new URL(request.url).searchParams.get('organizationSlug') || '';
    const ctx = await resolvePortalContext(requested);
    const org = ctx.organization.slug;

    const [project] = await db
      .select({ config: projects.tenantRuntimeConfig, title: projects.title })
      .from(projects)
      .where(eq(projects.slug, org))
      .limit(1);

    const brand = pickBrand((project?.config as any)?.brandConfig);
    const origin = new URL(request.url).origin;

    const [playfair, inter, interSemi] = await Promise.all([
      loadFont(origin, 'fonts/Playfair-Bold-static.ttf'),
      loadFont(origin, 'fonts/Inter-Regular-static.ttf'),
      loadFont(origin, 'fonts/Inter-SemiBold-static.ttf'),
    ]);

    const content = buildTemplateElement({
      template,
      brand,
      lines,
      goldLine,
      kicker,
      body: bodyText,
      imageUrl,
      phone: typeof body.phone === 'string' ? body.phone : null,
      width,
      height,
    });

    // El árbol de plantillas es data, no JSX: se castea en la frontera con Satori.
    const image = new ImageResponse(content as any, {
      width,
      height,
      fonts: [
        { name: 'Playfair', data: playfair, weight: 700, style: 'normal' },
        { name: 'Inter', data: inter, weight: 400, style: 'normal' },
        { name: 'Inter', data: interSemi, weight: 600, style: 'normal' },
      ],
    });

    const buffer = Buffer.from(await image.arrayBuffer());
    const asset = await uploadTenantAsset({
      canonicalOrgId: org,
      bytes: buffer,
      filename: `${template}-${format}.png`,
      mimeType: 'image/png',
      title: `${template} · ${lines[0]}`.slice(0, 200),
      source: 'generated',
      createdBy: `hermes:media-render`,
    });

    return NextResponse.json({
      ok: true,
      organization: org,
      template,
      format,
      url: asset.url,
      width,
      height,
    });
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    console.error('[MediaRender] error:', err);
    return NextResponse.json({ error: err?.message || 'No se pudo renderizar' }, { status: 500 });
  }
}
