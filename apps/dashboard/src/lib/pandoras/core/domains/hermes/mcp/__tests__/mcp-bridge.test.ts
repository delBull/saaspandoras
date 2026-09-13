import { describe, it, expect, beforeEach } from '@jest/globals';
import { HermesMcpBridge } from '../mcp-bridge';
import { HermesToolExecutor } from '../../runtime/tool-executor';

describe('🔌 Hermes MCP Bridge Transport & Zero-Trust Suite (F6)', () => {
  let bridge: HermesMcpBridge;
  let executor: HermesToolExecutor;

  beforeEach(() => {
    bridge = HermesMcpBridge.getInstance();
    bridge.clear();
    executor = new HermesToolExecutor();
  });

  it('ANTI-SSRF: debe rechazar servidores MCP con endpoints dirigidos a Cloud Metadata o IPs prohibidas', async () => {
    await expect(
      bridge.registerServer({
        id: 'malicious_mcp',
        name: 'Malicious Server',
        transport: 'HTTP_SSE',
        endpoint: 'http://169.254.169.254/sse',
      })
    ).rejects.toThrow(/rejected by EgressGuard/i);

    await expect(
      bridge.registerServer({
        id: 'local_leak_mcp',
        name: 'Local Server',
        transport: 'HTTP_SSE',
        endpoint: 'http://localhost:9999/mcp',
      })
    ).rejects.toThrow(/rejected by EgressGuard/i);
  });

  it('debe registrar un servidor MCP y montar herramientas filtradas por allowedTools', async () => {
    await bridge.registerServer({
      id: 'weather_service',
      name: 'Weather MCP Server',
      transport: 'IN_PROCESS',
      allowedTools: ['get_forecast'],
      deniedTools: ['delete_station'],
    });

    // Herramienta permitida
    bridge.mountTool(
      'weather_service',
      { name: 'get_forecast', description: 'Obtiene pronóstico del clima' },
      async (args) => ({ temperature: 28, condition: 'Soleado en Tulum' })
    );

    // Herramienta NO en allowedTools
    bridge.mountTool(
      'weather_service',
      { name: 'modify_sensor', description: 'Modifica calibración' },
      async () => ({ ok: false })
    );

    // Herramienta explícitamente en deniedTools
    bridge.mountTool(
      'weather_service',
      { name: 'delete_station', description: 'Elimina estación' },
      async () => ({ deleted: true })
    );

    const tools = bridge.listTools('weather_service');
    expect(tools.length).toBe(1);
    expect(tools[0]?.name).toBe('get_forecast');
  });

  it('debe ejecutar una herramienta montada y respetar el aislamiento multitenant', async () => {
    await bridge.registerServer({
      id: 'snarai_private_crm',
      name: 'CRM Privado S\'Narai',
      transport: 'IN_PROCESS',
      tenantScope: 'snarai',
    });

    bridge.mountTool(
      'snarai_private_crm',
      { name: 'get_lead_stats', description: 'Estadísticas de prospectos' },
      async () => ({ leadsCount: 42, activeInvestors: 8 })
    );

    // Ejecución válida por tenant autorizado
    const validRes = await bridge.executeTool({
      serverId: 'snarai_private_crm',
      toolName: 'get_lead_stats',
      tenantId: 'snarai',
    });

    expect(validRes.success).toBe(true);
    expect((validRes.data as any).leadsCount).toBe(42);

    // Ejecución rechazada por cross-tenant violation
    const crossRes = await bridge.executeTool({
      serverId: 'snarai_private_crm',
      toolName: 'get_lead_stats',
      tenantId: 'otro_tenant_intruso',
    });

    expect(crossRes.success).toBe(false);
    expect(crossRes.error).toContain('Cross-tenant violation');
  });

  it('TOOL GATEWAY: debe despachar mcp.execute a través de HermesToolExecutor', async () => {
    await bridge.registerServer({
      id: 'global_utils',
      name: 'Utilidades Globales',
      transport: 'IN_PROCESS',
    });

    bridge.mountTool(
      'global_utils',
      { name: 'ping', description: 'Ping test' },
      async () => ({ pong: true, time: Date.now() })
    );

    const response = await executor.executeTool(
      {
        organizationId: 'global',
        actorId: 'actor_test',
        capabilityId: 'mcp.execute',
        toolName: 'mcp.execute',
        parameters: { serverId: 'global_utils', toolName: 'ping' },
      },
      [{ id: 'mcp.execute' }]
    );

    expect(response.success).toBe(true);
    expect((response.data as any).success).toBe(true);
    expect((response.data as any).data.pong).toBe(true);
  });
});
