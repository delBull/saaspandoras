import { describe, it, expect } from 'vitest';
import { linkifySegments, hasLink } from '../linkify';

const links = (text: string) => linkifySegments(text).filter((s) => s.type === 'link');

describe('linkifySegments', () => {
  it('deja el texto normal intacto', () => {
    const segments = linkifySegments('hola Pablo, revisa el deal');
    expect(segments).toEqual([{ type: 'text', value: 'hola Pablo, revisa el deal' }]);
    expect(hasLink('hola Pablo')).toBe(false);
  });

  it('convierte una URL https en enlace', () => {
    const segments = linkifySegments('mira https://dash.pandoras.finance/deal/PDR-SNARAI ya');
    expect(segments).toHaveLength(3);
    expect(segments[1]!).toEqual({
      type: 'link',
      value: 'https://dash.pandoras.finance/deal/PDR-SNARAI',
      href: 'https://dash.pandoras.finance/deal/PDR-SNARAI',
    });
    expect(segments[2]!.value).toBe(' ya');
  });

  it('agrega https:// a un enlace que empieza con www.', () => {
    const [link] = links('entra a www.pandoras.finance');
    expect(link!.href).toBe('https://www.pandoras.finance');
    expect(link!.value).toBe('www.pandoras.finance');
  });

  it('recorta el punto final de la frase', () => {
    const segments = linkifySegments('el documento está en https://dash.pandoras.finance/x.');
    const link = segments.find((s) => s.type === 'link');
    expect(link?.value).toBe('https://dash.pandoras.finance/x');
    expect(segments.at(-1)).toEqual({ type: 'text', value: '.' });
  });

  it('no se come el paréntesis de cierre cuando la URL lo abre (Wikipedia)', () => {
    const [link] = links('https://en.wikipedia.org/wiki/Bucer%C3%ADas_(Nayarit)');
    expect(link!.value).toBe('https://en.wikipedia.org/wiki/Bucer%C3%ADas_(Nayarit)');
  });

  it('deja fuera el paréntesis que envuelve la URL', () => {
    const segments = linkifySegments('(ver https://pandoras.finance)');
    expect(segments[0]!).toEqual({ type: 'text', value: '(ver ' });
    expect(segments[1]!).toMatchObject({ type: 'link', value: 'https://pandoras.finance' });
    expect(segments[2]!).toEqual({ type: 'text', value: ')' });
  });

  it('soporta varios enlaces en un mensaje', () => {
    const found = links('uno https://a.com/x y dos https://b.com/y');
    expect(found.map((l) => l.value)).toEqual(['https://a.com/x', 'https://b.com/y']);
  });

  it('no convierte esquemas peligrosos en enlaces', () => {
    expect(hasLink('javascript:alert(1)')).toBe(false);
    expect(hasLink('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(hasLink('ftp://archivo.local/x')).toBe(false);
  });

  it('con texto vacío devuelve lista vacía', () => {
    expect(linkifySegments('')).toEqual([]);
    expect(hasLink('')).toBe(false);
  });

  it('conserva el texto completo al reconstruir los segmentos', () => {
    const original = 'link https://a.com/x, luego (https://b.com/y) y fin.';
    const rebuilt = linkifySegments(original).map((s) => s.value).join('');
    expect(rebuilt).toBe(original);
  });
});
