import { describe, it, expect, afterEach } from 'vitest';
import { enforceA2AEnvironment, allowedA2AEnvironments } from '../a2a-env';

function reqWith(headers: Record<string, string> = {}) {
  return new Request('http://localhost/x', { headers });
}

describe('enforceA2AEnvironment — H5 env allowlist', () => {
  const original = process.env.A2A_ALLOWED_ENVIRONMENTS;
  afterEach(() => {
    if (original === undefined) delete process.env.A2A_ALLOWED_ENVIRONMENTS;
    else process.env.A2A_ALLOWED_ENVIRONMENTS = original;
  });

  it('allows session auth (no client environment)', () => {
    expect(enforceA2AEnvironment(reqWith(), undefined).ok).toBe(true);
  });

  it('allows a matching environment with the default (both) allowlist', () => {
    expect(enforceA2AEnvironment(reqWith(), 'production').ok).toBe(true);
    expect(enforceA2AEnvironment(reqWith(), 'staging').ok).toBe(true);
  });

  it('rejects a declared header that contradicts the key environment (400)', () => {
    const r = enforceA2AEnvironment(reqWith({ 'X-Pandora-Environment': 'staging' }), 'production');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('rejects a disallowed environment when an allowlist is provided (403)', () => {
    const r = enforceA2AEnvironment(reqWith(), 'staging', ['production']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it('parses A2A_ALLOWED_ENVIRONMENTS (defaults to both)', () => {
    process.env.A2A_ALLOWED_ENVIRONMENTS = 'production';
    expect(allowedA2AEnvironments()).toEqual(['production']);
    process.env.A2A_ALLOWED_ENVIRONMENTS = '';
    expect(allowedA2AEnvironments()).toEqual(['staging', 'production']);
    process.env.A2A_ALLOWED_ENVIRONMENTS = 'bogus';
    expect(allowedA2AEnvironments()).toEqual(['staging', 'production']);
  });
});
