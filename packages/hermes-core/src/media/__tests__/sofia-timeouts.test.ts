import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Los timeouts del pipeline de Sofía deben ser configurables y suficientes.
 *
 * Fallan si alguien vuelve a fijarlos en 2.5 s / 15 s (una imagen tarda ~20 s y
 * el sondeo post-ACK expiraba, dejando el job en UNKNOWN).
 */

async function loadService() {
  vi.resetModules();
  const mod = await import('../hermes-media-orchestrator.service');
  return mod.HermesMediaOrchestratorService;
}

describe('Sofía: timeouts del pipeline', () => {
  afterEach(() => {
    delete process.env.SOFIA_PRE_ACK_TIMEOUT_MS;
    delete process.env.SOFIA_POST_ACK_TIMEOUT_MS;
  });

  it('TMO-01: por defecto pre-ACK 5 s y post-ACK 120 s', async () => {
    const svc = await loadService();
    expect(svc.PRE_ACK_TIMEOUT_MS).toBe(5000);
    expect(svc.POST_ACK_TIMEOUT_MS).toBe(120000);
  });

  it('TMO-02: se pueden ajustar por entorno', async () => {
    process.env.SOFIA_PRE_ACK_TIMEOUT_MS = '8000';
    process.env.SOFIA_POST_ACK_TIMEOUT_MS = '180000';
    const svc = await loadService();
    expect(svc.PRE_ACK_TIMEOUT_MS).toBe(8000);
    expect(svc.POST_ACK_TIMEOUT_MS).toBe(180000);
  });

  it('TMO-03: valores inválidos caen al default (no a 0)', async () => {
    process.env.SOFIA_PRE_ACK_TIMEOUT_MS = 'abc';
    process.env.SOFIA_POST_ACK_TIMEOUT_MS = '-5';
    const svc = await loadService();
    expect(svc.PRE_ACK_TIMEOUT_MS).toBe(5000);
    expect(svc.POST_ACK_TIMEOUT_MS).toBe(120000);
  });

  it('TMO-04: el post-ACK debe superar el tiempo real de una imagen (~20 s)', async () => {
    const svc = await loadService();
    expect(svc.POST_ACK_TIMEOUT_MS).toBeGreaterThan(20000);
  });
});
