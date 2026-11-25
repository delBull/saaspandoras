import { describe, it, expect } from 'vitest';
import { isSafeReturnPath, normalizeReturnPath, slugFromReturnPath } from '../safe-return';

describe('Portal · retorno seguro tras el login', () => {
  it('acepta rutas del mismo origen, incluidas las de Growth OS', () => {
    expect(isSafeReturnPath('/growth-os/organizations/snarai')).toBe(true);
    expect(isSafeReturnPath('/growth-os/organizations/snarai/approvals')).toBe(true);
    expect(isSafeReturnPath('/portal/snarai/media')).toBe(true);
  });

  it('rechaza otros orígenes y trucos de redirección', () => {
    expect(isSafeReturnPath('//evil.example/x')).toBe(false);
    expect(isSafeReturnPath('https://evil.example')).toBe(false);
    expect(isSafeReturnPath('/\\evil.example')).toBe(false);
    expect(isSafeReturnPath('/growth-os/../admin')).toBe(false);
    expect(isSafeReturnPath('/growth-os/organizations/snarai con espacios')).toBe(false);
    expect(isSafeReturnPath('')).toBe(false);
    expect(isSafeReturnPath(undefined)).toBe(false);
  });

  it('no devuelve al login ni a endpoints de API', () => {
    expect(isSafeReturnPath('/portal/login')).toBe(false);
    expect(isSafeReturnPath('/api/v1/portal/auth')).toBe(false);
  });

  it('normaliza sin barra final y devuelve null si no es seguro', () => {
    expect(normalizeReturnPath('/growth-os/organizations/snarai/')).toBe('/growth-os/organizations/snarai');
    expect(normalizeReturnPath('/')).toBeNull();
    expect(normalizeReturnPath('//evil.example')).toBeNull();
  });

  it('extrae el slug del tenant del retorno', () => {
    expect(slugFromReturnPath('/growth-os/organizations/snarai')).toBe('snarai');
    expect(slugFromReturnPath('/growth-os/organizations/snarai/approvals')).toBe('snarai');
    expect(slugFromReturnPath('/portal/snarai/media')).toBe('snarai');
    expect(slugFromReturnPath('/growth-os/organizations')).toBeNull();
    expect(slugFromReturnPath(null)).toBeNull();
  });
});
