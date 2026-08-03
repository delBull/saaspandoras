/**
 * 🛠️ Pandora's Platform OS — Universal Tool Registry
 * lib/hermes/tool-registry.ts
 *
 * Decoupled registry of all executable tools, capabilities, and integrations.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'calendar' | 'payments' | 'crm' | 'communication' | 'tokenization';
  inputSchema: Record<string, string>;
  permissionsRequired: string[];
  timeoutMs: number;
}

const TOOLS_LIST: [string, ToolDefinition][] = [
  [
    'calendar.schedule',
    {
      id: 'calendar.schedule',
      name: 'Agendamiento de Citas',
      category: 'calendar',
      inputSchema: { requestedSlot: 'string', email: 'string' },
      permissionsRequired: ['calendar:write'],
      timeoutMs: 5000,
    },
  ],
  [
    'payments.create_spei_link',
    {
      id: 'payments.create_spei_link',
      name: 'Generador SPEI Fast Lane',
      category: 'payments',
      inputSchema: { amount: 'number', reference: 'string' },
      permissionsRequired: ['payments:create'],
      timeoutMs: 4000,
    },
  ],
  [
    'crm.update_stage',
    {
      id: 'crm.update_stage',
      name: 'Actualización de Estado CRM',
      category: 'crm',
      inputSchema: { leadId: 'string', stage: 'string' },
      permissionsRequired: ['crm:write'],
      timeoutMs: 3000,
    },
  ],
  [
    'tokenization.get_holdings',
    {
      id: 'tokenization.get_holdings',
      name: 'Consulta de Holdings RWA',
      category: 'tokenization',
      inputSchema: { walletAddress: 'string' },
      permissionsRequired: ['tokenization:read'],
      timeoutMs: 4000,
    },
  ],
];

export class ToolRegistry {
  private static toolsMap: Map<string, ToolDefinition> = new Map(TOOLS_LIST);

  static get(toolId: string): ToolDefinition | undefined {
    return this.toolsMap.get(toolId);
  }

  static listAll(): ToolDefinition[] {
    return Array.from(this.toolsMap.values());
  }
}
