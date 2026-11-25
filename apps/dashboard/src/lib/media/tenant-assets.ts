/**
 * 🖼️ Biblioteca de medios por tenant (ADR-020 §2.3-bis)
 *
 * Instagram no acepta archivos: publica con una **URL https pública**. Esta capa
 * sube el archivo a almacenamiento público (Vercel Blob) y registra el asset por
 * organización, para que el post sólo tenga que referenciar `url`.
 *
 * Multi-tenant: el path incluye el slug y la fila lleva `canonical_org_id`. La
 * organización la decide el servidor (sesión), nunca el cliente.
 */
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { db } from '@saasfly/db';
import { tenantMediaAssets } from '@saasfly/db/schema';
import { desc, eq } from '@saasfly/db-core';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function slugify(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/** Ruta pública del asset: incluye tenant y mes para que sea legible y ordenada. */
export function buildAssetPath(org: string, filename: string, now: Date = new Date()): string {
  const rawExt = String(filename.split('.').pop() || '').toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : ['jpg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const base = slugify(filename.replace(/\.[a-z0-9]+$/i, '')) || 'asset';
  const rand = crypto.randomBytes(3).toString('hex');
  return `tenants/${slugify(org)}/${year}/${month}/${base}-${rand}.${ext}`;
}

export function validateImageUpload(input: { mimeType?: string | null; sizeBytes?: number | null }): {
  ok: boolean;
  error?: string;
} {
  const mime = String(input.mimeType || '').toLowerCase();
  if (!ALLOWED_MIME[mime]) {
    return { ok: false, error: `Formato no soportado (${mime || 'desconocido'}). Usa JPG, PNG o WebP.` };
  }
  const size = Number(input.sizeBytes || 0);
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: 'Archivo vacío.' };
  if (size > MAX_IMAGE_BYTES) return { ok: false, error: 'La imagen supera 8 MB.' };
  return { ok: true };
}

export interface UploadedAsset {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

export async function uploadTenantAsset(input: {
  canonicalOrgId: string;
  bytes: Buffer;
  filename: string;
  mimeType: string;
  title?: string | null;
  source?: 'manual' | 'generated';
  createdBy?: string | null;
}): Promise<UploadedAsset> {
  const check = validateImageUpload({ mimeType: input.mimeType, sizeBytes: input.bytes.length });
  if (!check.ok) throw new Error(check.error);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Almacenamiento no configurado (BLOB_READ_WRITE_TOKEN).');

  const pathname = buildAssetPath(input.canonicalOrgId, input.filename);
  const blob = await put(pathname, input.bytes, {
    access: 'public',
    token,
    contentType: input.mimeType,
    addRandomSuffix: false,
  });

  const id = `ast_${crypto.randomUUID()}`;
  const title = (input.title || input.filename).slice(0, 200);

  await db.insert(tenantMediaAssets).values({
    id,
    canonicalOrgId: input.canonicalOrgId,
    kind: 'image',
    title,
    url: blob.url.slice(0, 1000),
    mimeType: input.mimeType,
    sizeBytes: input.bytes.length,
    source: input.source ?? 'manual',
    createdBy: input.createdBy ?? null,
    meta: { pathname },
  });

  return { id, url: blob.url, title, createdAt: new Date().toISOString() };
}

export async function listTenantAssets(canonicalOrgId: string, limit = 60): Promise<UploadedAsset[]> {
  const rows = await db
    .select({
      id: tenantMediaAssets.id,
      url: tenantMediaAssets.url,
      title: tenantMediaAssets.title,
      createdAt: tenantMediaAssets.createdAt,
    })
    .from(tenantMediaAssets)
    .where(eq(tenantMediaAssets.canonicalOrgId, canonicalOrgId))
    .orderBy(desc(tenantMediaAssets.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  }));
}
