export type PlatformRole = 'applicant' | 'pandorian' | 'admin';

/** Canonicalizes legacy and UI role names before navigation decisions. */
export function normalizePlatformRole(role: unknown): PlatformRole {
  const value = typeof role === 'string' ? role.trim().toLowerCase() : '';

  if (value === 'admin' || value === 'superadmin') return 'admin';
  if (value === 'pandorian') return 'pandorian';
  return 'applicant';
}

export function hasFullPlatformAccess(role: unknown): boolean {
  const normalized = normalizePlatformRole(role);
  return normalized === 'admin' || normalized === 'pandorian';
}

export function isAdminPlatformRole(role: unknown): boolean {
  return normalizePlatformRole(role) === 'admin';
}
