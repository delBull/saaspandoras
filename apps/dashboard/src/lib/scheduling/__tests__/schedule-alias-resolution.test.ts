import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveUserByAlias } from '@/actions/scheduling';
import { db } from '@/db';

describe('📅 Scheduling Alias Resolution & Multi-Tenant Support', () => {
  it('resolves static platform aliases like "pandoras" to the platform team', async () => {
    const res = await resolveUserByAlias('pandoras');
    expect(res.success).toBe(true);
    expect(res.userId).toBeDefined();
    expect(res.name).toBe("Equipo Pandora's");
  });

  it('resolves project by organizationId UUID without 404', async () => {
    // S'Narai's canonical organizationId UUID
    const SNARAI_UUID = '9079ecf5-2162-4078-bddf-66b607e2d32f';
    const res = await resolveUserByAlias(SNARAI_UUID);
    expect(res.success).toBe(true);
    expect(res.userId).toBeDefined();
    expect(res.name).toBeDefined();
  });

  it('resolves project by slug ("snarai")', async () => {
    const res = await resolveUserByAlias('snarai');
    expect(res.success).toBe(true);
    expect(res.userId).toBeDefined();
  });

  it('returns success: false for non-existent alias', async () => {
    const res = await resolveUserByAlias('non_existent_random_alias_12345');
    expect(res.success).toBe(false);
    expect(res.error).toBe('User not found');
  });

  it('returns success: false for empty alias', async () => {
    const res = await resolveUserByAlias('');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Empty alias');
  });
});
