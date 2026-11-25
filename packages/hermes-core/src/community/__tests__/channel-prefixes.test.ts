import { describe, it, expect } from 'vitest';
import { isChannelOfTenant, resolveChannelPrefix } from '../channel-prefixes';

describe('Canales por tenant', () => {
  it('S\'Narai conserva su prefijo histórico', () => {
    expect(resolveChannelPrefix('snarai')).toBe('s-narai');
    expect(isChannelOfTenant('s-narai-anuncios', 'snarai')).toBe(true);
    expect(isChannelOfTenant('s-narai-preguntas', 'snarai')).toBe(true);
  });

  it('un tenant nuevo usa su slug como prefijo, sin alias', () => {
    expect(resolveChannelPrefix('coffree')).toBe('coffree');
    expect(isChannelOfTenant('coffree-avisos', 'coffree')).toBe(true);
    expect(isChannelOfTenant('s-narai-anuncios', 'coffree')).toBe(false);
  });

  it('no deja escribir en canales de otro tenant', () => {
    expect(isChannelOfTenant('coffree-avisos', 'snarai')).toBe(false);
    expect(isChannelOfTenant('s-narai-anuncios', 'pandoras')).toBe(false);
    expect(isChannelOfTenant('miembros-documentos', 'snarai')).toBe(false);
    expect(isChannelOfTenant('general', 'snarai')).toBe(false);
  });

  it('rechaza nombres que intentan escapar del prefijo', () => {
    expect(isChannelOfTenant('s-narai-anuncios\n@everyone', 'snarai')).toBe(false);
    expect(isChannelOfTenant('S-NARAI-ANUNCIOS', 'snarai')).toBe(false);
    expect(isChannelOfTenant('s-narai-', 'snarai')).toBe(false);
    expect(isChannelOfTenant('', 'snarai')).toBe(false);
  });

  it('un slug inválido no genera prefijo y por tanto no autoriza nada', () => {
    expect(resolveChannelPrefix('')).toBeNull();
    expect(resolveChannelPrefix('x')).toBeNull(); // menos de 2 caracteres
    expect(isChannelOfTenant('x-avisos', 'x')).toBe(false);
  });
});
