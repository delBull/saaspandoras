import { describe, it, expect } from 'vitest';
import { buildAssetPath, slugify, validateImageUpload, MAX_IMAGE_BYTES } from '../tenant-assets';

describe('Biblioteca de medios · validación', () => {
  it('acepta jpg, png y webp dentro del límite', () => {
    expect(validateImageUpload({ mimeType: 'image/jpeg', sizeBytes: 1024 }).ok).toBe(true);
    expect(validateImageUpload({ mimeType: 'image/png', sizeBytes: 1024 }).ok).toBe(true);
    expect(validateImageUpload({ mimeType: 'image/webp', sizeBytes: 1024 }).ok).toBe(true);
  });

  it('rechaza formatos no soportados y archivos grandes', () => {
    expect(validateImageUpload({ mimeType: 'image/gif', sizeBytes: 10 }).ok).toBe(false);
    expect(validateImageUpload({ mimeType: 'application/pdf', sizeBytes: 10 }).ok).toBe(false);
    expect(validateImageUpload({ mimeType: 'image/jpeg', sizeBytes: 0 }).ok).toBe(false);
    expect(validateImageUpload({ mimeType: 'image/jpeg', sizeBytes: MAX_IMAGE_BYTES + 1 }).ok).toBe(false);
  });
});

describe('Biblioteca de medios · rutas', () => {
  it('separa por tenant, año y mes', () => {
    const path = buildAssetPath('snarai', 'Render del proyecto.JPG', new Date('2026-12-01T00:00:00Z'));
    expect(path.startsWith('tenants/snarai/2026/12/render-del-proyecto-')).toBe(true);
    expect(path.endsWith('.jpg')).toBe(true);
  });

  it('un tenant nuevo usa su propio path (no comparte con snarai)', () => {
    const path = buildAssetPath('coffree', 'foto.png', new Date('2026-01-05T00:00:00Z'));
    expect(path.startsWith('tenants/coffree/2026/01/')).toBe(true);
    expect(path).not.toContain('snarai');
  });

  it('normaliza nombres raros a slug', () => {
    expect(slugify("S'Narai · Bucerías")).toBe('s-narai-bucerias');
    expect(slugify('   ')).toBe('');
  });
});
