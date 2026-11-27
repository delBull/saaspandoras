#!/usr/bin/env bun
/**
 * Sube las piezas de una carpeta a la **biblioteca del tenant**
 * (`tenant_media_assets`), que es la fuente de verdad de la media y la que
 * expone `/portal/<slug>/media`. Devuelve la URL https de cada archivo para
 * poder proponer la publicación.
 *
 * Uso:
 *   DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… bun apps/dashboard/scripts/upload-tenant-media.ts \
 *     --slug=snarai --dir="/ruta/a/piezas" [--prefix="S'Narai · Lote 1"] [--dry]
 *
 * No publica nada: sólo registra la media en la biblioteca.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { db } from '@saasfly/db-core';
import { eq } from '@saasfly/db-core';
import { projects } from '@saasfly/db-core/schema';
import { uploadTenantAsset } from '../src/lib/media/tenant-assets';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const slug = (arg('slug') || '').trim().toLowerCase();
  const dir = (arg('dir') || '').trim();
  const prefix = (arg('prefix') || '').trim();
  const dry = process.argv.includes('--dry');

  if (!slug || !dir) {
    console.error('Uso: --slug=<tenant> --dir=<carpeta> [--prefix="…"] [--dry]');
    process.exit(1);
  }

  const [project] = await db
    .select({ id: projects.id, title: projects.title, organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project?.organizationId) {
    console.error(`❌ No existe el tenant '${slug}' o no tiene organización canónica.`);
    process.exit(1);
  }

  const files = readdirSync(dir)
    .filter((name) => MIME[path.extname(name).toLowerCase()])
    .sort();

  if (files.length === 0) {
    console.error(`❌ No hay imágenes ni videos en ${dir}`);
    process.exit(1);
  }

  console.log(`tenant: ${slug} (${project.organizationId}) · ${files.length} archivo(s)${dry ? ' · DRY RUN' : ''}`);

  const result: Array<{ file: string; url: string; bytes: number }> = [];

  for (const name of files) {
    const full = path.join(dir, name);
    const ext = path.extname(name).toLowerCase();
    const bytes = statSync(full).size;

    if (dry) {
      console.log(`  [dry] ${name} · ${(bytes / 1024).toFixed(0)} KB`);
      continue;
    }

    const buffer = Buffer.from(await Bun.file(full).arrayBuffer());
    const asset = await uploadTenantAsset({
      canonicalOrgId: project.organizationId,
      bytes: buffer,
      filename: name,
      mimeType: MIME[ext],
      title: prefix ? `${prefix} · ${path.parse(name).name}` : path.parse(name).name,
      source: 'manual',
      createdBy: 'script:upload-tenant-media',
    });

    result.push({ file: name, url: asset.url, bytes });
    console.log(`  ✓ ${name} → ${asset.url}`);
  }

  if (!dry) {
    console.log('\nJSON (para la propuesta):');
    console.log(JSON.stringify(result, null, 2));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error subiendo media:', err?.message || err);
    process.exit(1);
  });
