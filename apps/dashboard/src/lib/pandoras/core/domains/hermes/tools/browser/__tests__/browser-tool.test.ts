import { describe, it, expect, beforeEach } from '@jest/globals';
import { WebBrowserTool, MockBrowserProvider } from '../browser-provider';
import { HermesToolExecutor } from '../../../runtime/tool-executor';

describe('🖥️ Hermes Browser Intelligence & Isolation Suite (F3)', () => {
  let executor: HermesToolExecutor;

  beforeEach(() => {
    executor = new HermesToolExecutor();
    WebBrowserTool.setProvider(new MockBrowserProvider());
  });

  it('ANTI-SSRF: debe bloquear tajantemente URLs dirigidas a IPs privadas o Cloud Metadata', async () => {
    await expect(
      WebBrowserTool.execute({ targetUrl: 'http://169.254.169.254/latest/meta-data' })
    ).rejects.toThrow(/Anti-SSRF Egress Blocked|RESTRICTED/i);

    await expect(
      WebBrowserTool.execute({ targetUrl: 'http://localhost:8080/admin' })
    ).rejects.toThrow(/Anti-SSRF Egress Blocked|RESTRICTED/i);

    await expect(
      WebBrowserTool.execute({ targetUrl: 'http://10.10.10.10/console' })
    ).rejects.toThrow(/Anti-SSRF Egress Blocked|RESTRICTED/i);
  });

  it('debe ejecutar una sesión de navegación dinámica con MockBrowserProvider', async () => {
    const snapshot = await WebBrowserTool.execute({
      targetUrl: 'https://snarai.com/portal',
      waitForSelector: '#dashboard-content',
      actions: [
        { type: 'CLICK', selector: '#explore-tab' },
        { type: 'WAIT_FOR_SELECTOR', selector: '.token-balance' },
      ],
      tenantId: 'snarai',
    });

    expect(snapshot.targetUrl).toBe('https://snarai.com/portal');
    expect(snapshot.title).toContain('Página Dinámica Renderizada');
    expect(snapshot.content).toContain('Dashboard Dinámico SPA');
    expect(snapshot.screenshotBase64).toBeDefined();
    expect(snapshot.executionLogs.length).toBeGreaterThan(2);
    expect(snapshot.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('TOOL GATEWAY: debe DENEGAR web.browser si el tenant no posee la capability autorizada', async () => {
    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'actor_marco',
        capabilityId: 'web.browser',
        toolName: 'web.browser',
        parameters: { targetUrl: 'https://snarai.com/dealroom' },
      },
      [{ id: 'payments.create_spei_link' }] // No tiene capability web.browser
    );

    expect(response.success).toBe(false);
    expect(response.unauthorized).toBe(true);
    expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
  });

  it('TOOL GATEWAY: debe PERMITIR web.browser si el tenant posee la capability autorizada', async () => {
    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'actor_marco',
        capabilityId: 'web.browser',
        toolName: 'web.browser',
        parameters: { targetUrl: 'https://snarai.com/dealroom' },
      },
      [{ id: 'web.browser' }]
    );

    expect(response.success).toBe(true);
    expect((response.data as any).title).toContain('Página Dinámica Renderizada');
  });
});
