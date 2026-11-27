import { describe, it, expect } from 'vitest';
import { buildInstagramEnvCredentials, platformEnvSuffix } from '../platform-credentials';

describe('platformEnvSuffix', () => {
  it('normaliza el slug para variables de entorno', () => {
    expect(platformEnvSuffix('snarai')).toBe('SNARAI');
    expect(platformEnvSuffix('media-co')).toBe('MEDIA_CO');
    expect(platformEnvSuffix('a.b c')).toBe('A_B_C');
  });
});

describe('buildInstagramEnvCredentials', () => {
  const env = {
    META_IG_USER_ID_SNARAI: '17841425380042995',
    META_IG_ACCESS_TOKEN_SNARAI: 'IGAAQtoken',
    META_IG_API_BASE_SNARAI: 'https://graph.facebook.com/v21.0',
  };

  it('usa entorno cuando está completo', () => {
    expect(buildInstagramEnvCredentials({ slug: 'snarai', env })).toEqual({
      igUserId: '17841425380042995',
      accessToken: 'IGAAQtoken',
      apiBase: 'https://graph.facebook.com/v21.0',
    });
  });

  it('sin token devuelve null (fail-closed)', () => {
    expect(
      buildInstagramEnvCredentials({
        slug: 'snarai',
        env: { META_IG_USER_ID_SNARAI: '17841425380042995' },
      }),
    ).toBeNull();
  });

  it('sin id devuelve null aunque haya token', () => {
    expect(
      buildInstagramEnvCredentials({ slug: 'snarai', env: { META_IG_ACCESS_TOKEN_SNARAI: 'x' } }),
    ).toBeNull();
  });

  it('toma id y host del config del tenant si faltan en entorno', () => {
    const creds = buildInstagramEnvCredentials({
      slug: 'snarai',
      env: { META_IG_ACCESS_TOKEN_SNARAI: 'IGAAQtoken' },
      community: { igUserId: '17841400000000001', igApiBase: 'https://graph.instagram.com/v21.0' },
    });
    expect(creds).toEqual({
      igUserId: '17841400000000001',
      accessToken: 'IGAAQtoken',
      apiBase: 'https://graph.instagram.com/v21.0',
    });
  });

  it('default al host de Instagram Login y sin barra final', () => {
    const creds = buildInstagramEnvCredentials({
      slug: 'snarai',
      env: { META_IG_USER_ID_SNARAI: '1', META_IG_ACCESS_TOKEN_SNARAI: 't' },
    });
    expect(creds?.apiBase).toBe('https://graph.instagram.com/v21.0');
  });

  it('slug vacío no resuelve nada', () => {
    expect(buildInstagramEnvCredentials({ slug: '', env })).toBeNull();
  });
});
