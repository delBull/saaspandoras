import { describe, it, expect } from 'vitest';
import { validateCommunityPost } from '../community-gateway';

describe('Publicaciones por red (ADR-020)', () => {
  it('Instagram exige imagen', () => {
    const sinImagen = validateCommunityPost({
      channel: 'snarai',
      text: 'Avance de obra en Bucerías.',
      platform: 'instagram',
    });
    expect(sinImagen.ok).toBe(false);
    expect(sinImagen.violations).toContain('Instagram requiere una imagen');

    const conImagen = validateCommunityPost({
      channel: 'snarai',
      text: 'Avance de obra en Bucerías.',
      platform: 'instagram',
      imageUrl: 'https://cdn.pandoras.finance/obra.jpg',
    });
    expect(conImagen.ok).toBe(true);
  });

  it('Facebook admite sólo texto', () => {
    const res = validateCommunityPost({
      channel: 'snarai',
      text: 'Cómo funciona el Título de Propiedad.',
      platform: 'facebook',
    });
    expect(res.ok).toBe(true);
  });

  it('en redes el canal es un handle, no un canal de Discord', () => {
    const res = validateCommunityPost({
      channel: '@snarai.riviera',
      text: 'Hola',
      platform: 'facebook',
    });
    expect(res.ok).toBe(true);
  });

  it('la política se aplica igual en cualquier red', () => {
    const res = validateCommunityPost({
      channel: 'snarai',
      text: 'Rendimiento fijo garantizado en el condo hotel.',
      platform: 'instagram',
      imageUrl: 'https://cdn/x.jpg',
    });
    expect(res.ok).toBe(false);
    expect(res.violations.join(' ')).toContain('condo-hotel');
  });

  it('una red desconocida se rechaza', () => {
    const res = validateCommunityPost({
      channel: 'snarai',
      text: 'Hola',
      platform: 'tiktok' as any,
    });
    expect(res.ok).toBe(false);
    expect(res.violations.join(' ')).toContain('Red no soportada');
  });
});
