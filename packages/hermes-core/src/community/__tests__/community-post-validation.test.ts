import { describe, it, expect } from 'vitest';
import { validateCommunityPost } from '../community-gateway';

/**
 * La política del tenant (banned_topics v2) es la primera barrera antes de que
 * una propuesta llegue a la aprobación humana. Si esto se afloja, el revisor se
 * convierte en el único filtro.
 */
describe('Community · validación de publicaciones', () => {
  const ok = (text: string, channel = 's-narai-preguntas') => validateCommunityPost({ channel, text });

  it('acepta texto limpio', () => {
    const r = ok('Gracias por la pregunta. El título de propiedad incluye estancias anuales según tu nivel.');
    expect(r.ok).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it('bloquea las palabras prohibidas por banned_topics', () => {
    expect(ok('El fideicomiso garantiza tu inversión').ok).toBe(false);
    expect(ok('Cumplimiento NOM-151').ok).toBe(false);
    expect(ok('Nuestro condo hotel en Bucerías').ok).toBe(false);
    expect(ok('Renta hotelera profesional').ok).toBe(false);
    expect(ok('El hotel abre en 2027').ok).toBe(false);
    expect(ok('Incluye 4 noches al año').ok).toBe(false);
    expect(ok('Cada CP vale 50 USD').ok).toBe(false);
    expect(ok('La estrategia de familia incluye piscina').ok).toBe(false);
    expect(ok('Rendimiento garantizado del 12%').ok).toBe(false);
  });

  it('no bloquea por precio pero avisa al revisor', () => {
    const r = ok('La aportación inicia en $50 USD por título');
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('no bloquea por enlaces, pero los marca', () => {
    const r = ok('Agenda aquí: https://dash.pandoras.finance/events/pandoras/1');
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.includes('enlaces'))).toBe(true);
  });

  it('rechaza vacío, exceso de longitud y canal inválido', () => {
    expect(ok('').ok).toBe(false);
    expect(ok('x'.repeat(1801)).ok).toBe(false);
    expect(validateCommunityPost({ channel: 'canal con espacios', text: 'hola' }).ok).toBe(false);
  });

  it('la palabra "hotelera" suelta no pasa por casualidad', () => {
    expect(ok('La operación hotelera mejora').ok).toBe(false);
  });
});
