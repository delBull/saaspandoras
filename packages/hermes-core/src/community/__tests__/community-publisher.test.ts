import { describe, it, expect } from 'vitest';
import { isAllowedChannelName } from '../community-publisher';

/**
 * La lista blanca de canales es la última barrera antes de tocar Discord: si el
 * agente propone un canal fuera de S'Narai, no se publica.
 */
describe('Community publisher · lista blanca de canales', () => {
  it('acepta los canales públicos de S\'Narai', () => {
    for (const channel of [
      's-narai-anuncios',
      's-narai-la-oportunidad',
      's-narai-avance',
      's-narai-preguntas',
      's-narai-amas',
    ]) {
      expect(isAllowedChannelName(channel)).toBe(true);
    }
  });

  it('rechaza canales de miembros, de otros tenants y nombres libres', () => {
    expect(isAllowedChannelName('miembros-documentos')).toBe(false);
    expect(isAllowedChannelName('general')).toBe(false);
    expect(isAllowedChannelName('s-narai-')).toBe(false);
    expect(isAllowedChannelName('s-narai-preguntas-x')).toBe(true); // sigue siendo s-narai-*
    expect(isAllowedChannelName('S-NARAI-PREGUNTAS')).toBe(false);
    expect(isAllowedChannelName('s-narai-preguntas\n@everyone')).toBe(false);
  });
});
