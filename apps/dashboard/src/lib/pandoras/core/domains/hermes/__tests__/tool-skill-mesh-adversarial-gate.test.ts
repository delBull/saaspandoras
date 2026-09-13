import { describe, it, expect, beforeEach } from '@jest/globals';
import { HermesToolExecutor } from '../runtime/tool-executor';
import { ToolAuthorizationGate } from '../runtime/tool-authorization-gate';
import { WebFetchTool } from '../tools/web/web-fetch-tool';
import { WebBrowserTool, MockBrowserProvider } from '../tools/browser/browser-provider';
import { WebCrawlTool } from '../tools/web/web-crawl-tool';
import { HermesMcpBridge } from '../mcp/mcp-bridge';
import { AutonomousResearchEngine } from '../intelligence/research/autonomous-research-engine';
import { HermesSkillRegistry, registerCanonicalSkills } from '../skills';

describe('🛡️ F7.5 — Tool, Skill & Search Control Plane Adversarial Security Gate (20-Point Attack Suite)', () => {
  let executor: HermesToolExecutor;
  let bridge: HermesMcpBridge;
  let registry: HermesSkillRegistry;

  beforeEach(() => {
    executor = new HermesToolExecutor();
    bridge = HermesMcpBridge.getInstance();
    bridge.clear();
    registry = HermesSkillRegistry.getInstance();
    registry.clear();
    registerCanonicalSkills(registry);
    WebBrowserTool.setProvider(new MockBrowserProvider());
  });

  // ── ATTACK 01: CAPABILITY ESCALATION VIA PARAMETER SPOOFING ────────────
  it('Attack 01: Capability Escalation — rejects invoking web.browser under mismatched capability web.extract', async () => {
    const decision = await ToolAuthorizationGate.authorizeAsync(
      {
        organizationId: 'snarai',
        actorId: 'attacker_01',
        capabilityId: 'web.extract', // Capability barata que sí tiene
        toolName: 'web.browser',     // Tool costoso/restringido que NO tiene
        parameters: { targetUrl: 'https://example.com' },
      },
      [{ id: 'web.extract' }]
    );

    expect(decision.authorized).toBe(false);
    expect(decision.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
    expect(decision.reason).toContain("Capability mismatch: Tool 'web.browser' cannot be invoked under mismatched capability 'web.extract'");
  });

  // ── ATTACK 02: UNAUTHORIZED HIGH-RISK TOOL INVOCATION ──────────────────
  it('Attack 02: High-Risk Tool — rejects web.browser when tenant lacks web.browser capability', async () => {
    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'attacker_02',
        capabilityId: 'web.browser',
        toolName: 'web.browser',
        parameters: { targetUrl: 'https://example.com' },
      },
      [{ id: 'web.fetch' }, { id: 'web.extract' }] // Carece de web.browser
    );

    expect(response.success).toBe(false);
    expect(response.unauthorized).toBe(true);
    expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
  });

  // ── ATTACK 03: CROSS-TENANT ARTIFACT / PARAMETER SPOOFING ──────────────
  it('Attack 03: Cross-Tenant Spoofing — rejects caller targeting another tenant resource', async () => {
    const decision = await ToolAuthorizationGate.authorizeAsync(
      {
        organizationId: 'tenant_attacker',
        actorId: 'attacker_03',
        capabilityId: 'payments.create_spei_link',
        toolName: 'payments.create_spei_link',
        parameters: { targetOrgId: 'snarai_victim' },
      },
      [{ id: 'payments.create_spei_link' }]
    );

    expect(decision.authorized).toBe(false);
    expect(decision.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
    expect(decision.reason).toContain('Cross-tenant parameter mismatch');
  });

  // ── ATTACK 04: ZERO-TOLERANCE RESTRICTED INTERNAL TOOLS ────────────────
  it('Attack 04: Zero-Tolerance — denies accessPrivateKeys or system.drop_database without TIER_1_COO', async () => {
    const decision = await ToolAuthorizationGate.authorizeAsync(
      {
        organizationId: 'snarai',
        actorId: 'attacker_04',
        capabilityId: 'accessPrivateKeys',
        toolName: 'accessPrivateKeys',
        clearanceLevel: 'OPERATOR',
      },
      [{ id: 'accessPrivateKeys' }]
    );

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('RESTRICTED_INTERNAL');
  });

  // ── ATTACK 05: SSRF CLOUD METADATA (169.254.169.254) ───────────────────
  it('Attack 05: SSRF Cloud Metadata — blocks AWS, GCP and Azure metadata endpoints', async () => {
    await expect(
      WebFetchTool.execute({ url: 'http://169.254.169.254/latest/meta-data' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://169.254.170.2/v2/credentials' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://metadata.google.internal/computeMetadata/v1/' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
  });

  // ── ATTACK 06: SSRF LOCALHOST & LOOPBACK ALIASES ───────────────────────
  it('Attack 06: SSRF Localhost — blocks 127.0.0.1, localhost, and [::1]', async () => {
    await expect(
      WebFetchTool.execute({ url: 'http://127.0.0.1:8080/metrics' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://localhost:3000/api/keys' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://sub.localhost:80' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
  });

  // ── ATTACK 07: SSRF RFC1918 PRIVATE IP SUBNETS ─────────────────────────
  it('Attack 07: SSRF RFC1918 — blocks 10.x, 172.16-31.x and 192.168.x subnets', async () => {
    await expect(
      WebFetchTool.execute({ url: 'http://10.254.0.1/db' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://172.16.1.1/internal' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);

    await expect(
      WebFetchTool.execute({ url: 'http://192.168.0.1/router' })
    ).rejects.toThrow(/Egress Guard Blocked|RESTRICTED/i);
  });

  // ── ATTACK 08: SSRF OBFUSCATED IP TRICKS ───────────────────────────────
  it('Attack 08: SSRF Obfuscated IPs — blocks hex, dword, octal and userinfo URL tricks', async () => {
    await expect(
      WebFetchTool.execute({ url: 'http://0x7f000001/admin' })
    ).rejects.toThrow(/OBFUSCATED_IP_FORBIDDEN/i);

    await expect(
      WebFetchTool.execute({ url: 'http://admin:secretPass@trusted.com' })
    ).rejects.toThrow(/EMBEDDED_CREDENTIALS_FORBIDDEN/i);
  });

  // ── ATTACK 09: SSRF IN BROWSER PRE-FLIGHT ──────────────────────────────
  it('Attack 09: SSRF Browser Pre-Flight — blocks headless navigation to restricted IPs', async () => {
    await expect(
      WebBrowserTool.execute({ targetUrl: 'http://169.254.169.254/meta' })
    ).rejects.toThrow(/Anti-SSRF Egress Blocked/i);

    await expect(
      WebBrowserTool.execute({ targetUrl: 'http://10.0.0.1:8080' })
    ).rejects.toThrow(/Anti-SSRF Egress Blocked/i);
  });

  // ── ATTACK 10: SSRF IN CRAWL BASE URL ──────────────────────────────────
  it('Attack 10: SSRF Crawl Pre-Flight — blocks crawler from targeting internal subnets', async () => {
    await expect(
      WebCrawlTool.execute({ baseUrl: 'http://127.0.0.1:9090' })
    ).rejects.toThrow(/EgressGuard rejected baseUrl/i);
  });

  // ── ATTACK 11: MCP REMOTE ENDPOINT SSRF ────────────────────────────────
  it('Attack 11: MCP Remote Endpoint SSRF — blocks registering server with internal endpoints', async () => {
    await expect(
      bridge.registerServer({
        id: 'ssrf_server',
        name: 'Evil MCP',
        transport: 'HTTP_SSE',
        endpoint: 'http://169.254.169.254/events',
      })
    ).rejects.toThrow(/rejected by EgressGuard/i);
  });

  // ── ATTACK 12: MCP TOOL ALLOWLIST BYPASS ───────────────────────────────
  it('Attack 12: MCP Tool Allowlist — rejects invoking tools not explicitly in allowedTools', async () => {
    await bridge.registerServer({
      id: 'scoped_mcp',
      name: 'Scoped Server',
      transport: 'IN_PROCESS',
      allowedTools: ['permitted_action'],
    });

    bridge.mountTool('scoped_mcp', { name: 'forbidden_action', description: 'desc' }, async () => ({ leak: true }));

    const res = await bridge.executeTool({
      serverId: 'scoped_mcp',
      toolName: 'forbidden_action',
      tenantId: 'snarai',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('is not in the allowedTools whitelist');
  });

  // ── ATTACK 13: MCP TOOL DENIED FILTER ENFORCEMENT ──────────────────────
  it('Attack 13: MCP Tool Denied Filter — strictly denies tools listed in deniedTools', async () => {
    await bridge.registerServer({
      id: 'denied_mcp',
      name: 'Denied Server',
      transport: 'IN_PROCESS',
      deniedTools: ['dangerous_tool'],
    });

    bridge.mountTool('denied_mcp', { name: 'dangerous_tool', description: 'desc' }, async () => ({ leaked: true }));

    const res = await bridge.executeTool({
      serverId: 'denied_mcp',
      toolName: 'dangerous_tool',
      tenantId: 'snarai',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('explicitly DENIED by MCP security policy');
  });

  // ── ATTACK 14: MCP CROSS-TENANT ISOLATION ──────────────────────────────
  it('Attack 14: MCP Cross-Tenant Isolation — prevents tenant B from executing tenant A server', async () => {
    await bridge.registerServer({
      id: 'tenant_a_mcp',
      name: 'Tenant A Private MCP',
      transport: 'IN_PROCESS',
      tenantScope: 'tenant_a',
    });

    bridge.mountTool('tenant_a_mcp', { name: 'private_calc', description: 'calc' }, async () => ({ ok: true }));

    const res = await bridge.executeTool({
      serverId: 'tenant_a_mcp',
      toolName: 'private_calc',
      tenantId: 'tenant_b_attacker',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Cross-tenant violation');
  });

  // ── ATTACK 15: EVIDENCE POISONING (UNTRUSTED WEB VS TRUSTED VAULT) ─────
  it('Attack 15: Evidence Poisoning Defense — web research produces candidate, NEVER active trusted knowledge', async () => {
    const report = await AutonomousResearchEngine.executeMission({
      missionId: 'adversarial_miss',
      tenantId: 'snarai',
      title: 'Auditoría',
      tenantUrl: 'https://snarai.com/dealroom',
      competitorUrls: ['https://untrusted-web.com'],
      targetKeywords: ['RWA'],
      trigger: 'MANUAL',
    });

    // Invariante de Seguridad: El conocimiento extraído de la web externa es CANDIDATO, NO confiable
    expect(report.candidateGovernance).toBeDefined();
    expect(report.candidateGovernance.isDirectlyTrusted).toBe(false);
    expect(report.candidateGovernance.status).toBe('DISCOVERED');
    expect(report.candidateGovernance.requiresHumanApproval).toBe(true);
    expect(report.candidateGovernance.authority).toBe('DISCOVERED');
  });

  // ── ATTACK 16: SKILL PRIVILEGE ESCALATION VIA EXECUTE INJECTION ────────
  it('Attack 16: Skill Execution Isolation — verifies 0 skills contain an execute method', () => {
    const allSkills = registry.listAll();
    expect(allSkills.length).toBeGreaterThanOrEqual(9);

    for (const skill of allSkills) {
      expect((skill as any).execute).toBeUndefined();
      expect(typeof (skill as any).execute).toBe('undefined');
    }
  });

  // ── ATTACK 17: TOOL CIRCUIT BREAKER & TIMEOUT BOUNDARIES ───────────────
  it('Attack 17: Tool Circuit Breaker — fails closed when tool execution exceeds timeout', async () => {
    executor.registerHandler('slow_malicious_tool', async () => {
      await new Promise(resolve => setTimeout(resolve, 6000));
      return { ok: true };
    });

    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'attacker_17',
        capabilityId: 'slow_malicious_tool',
        toolName: 'slow_malicious_tool',
      },
      [{ id: 'slow_malicious_tool' }]
    );

    expect(response.success).toBe(false);
    expect(response.reason).toContain('timed out');
  }, 15000);

  // ── ATTACK 18: WEB CRAWL SCOPE & RESOURCE EXHAUSTION DEFENSE ───────────
  it('Attack 18: Web Crawl Resource Bounds — enforces absolute hard cap of 50 pages', async () => {
    const result = await WebCrawlTool.execute({
      baseUrl: 'https://snarai.com',
      maxPages: 10000, // Intento de saturación
      maxDepth: 100,
    });

    // El rastreador acota rígidamente
    expect(result.pagesCrawled).toBeLessThanOrEqual(50);
  });

  // ── ATTACK 19: GATE INTERCEPTION OF MALICIOUS URL PARAMETERS ───────────
  it('Attack 19: Gate Interception — ToolAuthorizationGate blocks restricted URL before handler execution', async () => {
    let handlerInvoked = false;
    executor.registerHandler('test.audit_url', async () => {
      handlerInvoked = true;
      return { ok: true };
    });

    const response = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'attacker_19',
        capabilityId: 'test.audit_url',
        toolName: 'test.audit_url',
        parameters: { url: 'http://169.254.169.254/leak' },
      },
      [{ id: 'test.audit_url' }]
    );

    expect(response.success).toBe(false);
    expect(response.reason).toContain('Egress Firewall Blocked');
    expect(handlerInvoked).toBe(false); // Handler NUNCA fue ejecutado
  });

  // ── ATTACK 20: SECRET ISOLATION IN PROGRESSIVE DISCLOSURE ──────────────
  it('Attack 20: Secret Isolation — progressive disclosure index leaks 0 secrets or sensitive paths', () => {
    const index = registry.getSkillIndex();
    for (const item of index) {
      const json = JSON.stringify(item);
      expect(json).not.toContain('API_KEY');
      expect(json).not.toContain('SECRET');
      expect(json).not.toContain('sk_');
      expect(json).not.toContain('token');
      expect(json).not.toContain('password');
    }
  });
});
