import { describe, it, expect } from 'vitest';
import { parseDmKeyword } from '../dm-keyword';

describe('Palabra clave por DM', () => {
  it('detecta la palabra sola', () => {
    expect(parseDmKeyword('SNARAI')).toEqual({ matched: true, code: null, keyword: 'SNARAI' });
    expect(parseDmKeyword('snarai!')).toMatchObject({ matched: true, code: null });
    expect(parseDmKeyword('  Hola, SNARAI  ')).toMatchObject({ matched: true });
  });

  it('extrae el código del post cuando viene acompañando', () => {
    expect(parseDmKeyword('SNARAI god2f7wy')).toEqual({ matched: true, code: 'god2f7wy', keyword: 'SNARAI' });
    expect(parseDmKeyword('snarai, 2jwttywg')).toMatchObject({ matched: true, code: '2jwttywg' });
  });

  it('no confunde la palabra clave con el código', () => {
    const res = parseDmKeyword('SNARAI');
    expect(res.code).toBeNull();
  });

  it('ignora mensajes que no son de campaña', () => {
    expect(parseDmKeyword('Hola, quiero información del proyecto').matched).toBe(false);
    expect(parseDmKeyword('').matched).toBe(false);
    // Mención tardía en un mensaje largo: no es entrada de campaña
    expect(parseDmKeyword('buenas tardes, vengo de instagram y quería preguntar algo sobre el proyecto snarai por favor').matched).toBe(false);
  });

  it('acepta una palabra clave configurable', () => {
    expect(parseDmKeyword('NARAI abcd1234', 'NARAI')).toMatchObject({ matched: true, code: 'abcd1234' });
    // un token demasiado corto no es un código válido
    expect(parseDmKeyword('NARAI v2', 'NARAI')).toMatchObject({ matched: true, code: null });
    expect(parseDmKeyword('SNARAI', 'NARAI').matched).toBe(false);
  });
});
