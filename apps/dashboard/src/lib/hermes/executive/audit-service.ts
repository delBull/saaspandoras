/**
 * 🏛️ Executive Audit Service (Tier 1: Read Everything / Canonical Audit Layer)
 * apps/dashboard/src/lib/hermes/executive/audit-service.ts
 *
 * Implements deep read and inspection capabilities across tenants, CRM leads,
 * security logs, and database schema parity for Marco (Executive Mode).
 * Consumes existing Drizzle schemas and platform models without ad-hoc bypasses.
 */

import { db } from '@/db';
import { 
  projects, 
  marketingLeads, 
  hermesSecurityEvents, 
  hermesTenantCredits,
  schedulingSlots,
  nexusCollaborators 
} from '@/db/schema';
import { eq, desc, sql, or } from 'drizzle-orm';

export interface TenantAuditReport {
  found: boolean;
  slug: string;
  name?: string;
  status?: string;
  applicantWallet?: string | null;
  w2eEnabled?: boolean;
  creditBalanceUsd?: string;
  totalSpentUsd?: string;
  isSandbox?: boolean;
  markdown: string;
}

export interface LeadsAuditReport {
  total: number;
  leads: {
    id: string | number;
    name: string | null;
    email: string | null;
    phone: string | null;
    intent: string | null;
    score: number | null;
    source: string | null;
    createdAt: Date;
  }[];
  markdown: string;
}

export interface SecurityLogsReport {
  total: number;
  events: {
    id: string;
    organizationId: string;
    eventType: string;
    severity: string;
    policyDecision: string;
    correlationId: string;
    createdAt: Date;
  }[];
  markdown: string;
}

export interface SchemaParityReport {
  checkedAt: string;
  allInParity: boolean;
  checkedColumns: { table: string; column: string; exists: boolean; dataType?: string }[];
  markdown: string;
}

export class ExecutiveAuditService {
  /**
   * Deeply inspects a specific tenant/project
   */
  public static async inspectTenant(slugOrId: string): Promise<TenantAuditReport> {
    const cleanSlug = slugOrId.trim().toLowerCase();

    try {
      const project = await db.query.projects.findFirst({
        where: or(
          eq(projects.slug, cleanSlug),
          /^\d+$/.test(cleanSlug) ? eq(projects.id, Number(cleanSlug)) : undefined
        ),
      });

      if (!project) {
        return {
          found: false,
          slug: cleanSlug,
          markdown: `⚠️ **Tenant no encontrado:** No se localizó ningún proyecto con el slug o ID \`${cleanSlug}\`.`,
        };
      }

      // Fetch credit balance if available
      let creditInfo: any = null;
      try {
        creditInfo = await db.query.hermesTenantCredits.findFirst({
          where: eq(hermesTenantCredits.tenantId, project.slug),
        });
      } catch {
        // Non-blocking
      }

      const mdLines: string[] = [
        `# 🏢 REPORTE DE INSPECCIÓN: ${project.title || project.slug.toUpperCase()}`,
        `• **Slug Canónico:** \`${project.slug}\` (ID: ${project.id})`,
        `• **Estado del Proyecto:** \`${project.status || 'ACTIVE'}\``,
        `• **Applicant Wallet:** \`${project.applicantWalletAddress || 'No especificada'}\``,
        `• **Creado:** ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/D'}`,
        '',
        `### ⚙️ CONFIGURACIÓN & CRÉDITOS DE CÓMPUTO`,
        `• **Balance de Crédito:** $${creditInfo?.creditBalanceUsd || '0.0000'} USD`,
        `• **Total Consumido:** $${creditInfo?.totalSpentUsd || '0.0000'} USD`,
        `• **Entorno Sandbox:** ${creditInfo?.isSandboxEnabled ? 'Activado' : 'Desactivado'}`,
        `• **Work-to-Earn Habilitado:** ${project.workToEarnEnabled ? 'Sí' : 'No'}`,
        `• **Contrato de Licencia:** \`${project.licenseContractAddress || 'Pendiente'}\``,
        `• **Tesorería On-Chain:** \`${project.treasuryAddress || 'No configurada'}\``,
      ];

      return {
        found: true,
        slug: project.slug,
        name: project.title,
        status: project.status,
        applicantWallet: project.applicantWalletAddress,
        w2eEnabled: project.workToEarnEnabled ?? undefined,
        creditBalanceUsd: creditInfo?.creditBalanceUsd,
        totalSpentUsd: creditInfo?.totalSpentUsd,
        isSandbox: creditInfo?.isSandboxEnabled ?? undefined,
        markdown: mdLines.join('\n'),
      };
    } catch (err: any) {
      console.error('[ExecutiveAuditService] Error inspecting tenant:', err);
      return {
        found: false,
        slug: cleanSlug,
        markdown: `❌ **Error al auditar tenant:** ${err.message}`,
      };
    }
  }

  /**
   * Inspects recent CRM leads across the ecosystem or by tenant
   */
  public static async inspectLeads(options?: { limit?: number; minScore?: number }): Promise<LeadsAuditReport> {
    const limit = options?.limit || 10;

    try {
      const records = await db.query.marketingLeads.findMany({
        orderBy: [desc(marketingLeads.createdAt)],
        limit,
      });

      const leads = records.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phoneNumber,
        intent: r.intent,
        score: r.score,
        source: r.source,
        createdAt: r.createdAt,
      }));

      const mdLines: string[] = [
        `# 👥 AUDITORÍA DE LEADS & PROSPECTOS (Últimos ${leads.length})`,
        '',
        '| ID | Nombre | Contacto | Intención | Score | Origen | Fecha |',
        '|---|---|---|---|---|---|---|',
      ];

      for (const l of leads) {
        const contact = l.email || l.phone || 'Anónimo';
        const dateStr = new Date(l.createdAt).toLocaleDateString();
        mdLines.push(
          `| ${l.id} | ${l.name || 'Sin nombre'} | \`${contact}\` | ${l.intent || 'explore'} | ${l.score ?? '-'} | ${l.source || 'web'} | ${dateStr} |`
        );
      }

      return {
        total: leads.length,
        leads,
        markdown: mdLines.join('\n'),
      };
    } catch (err: any) {
      console.error('[ExecutiveAuditService] Error inspecting leads:', err);
      return {
        total: 0,
        leads: [],
        markdown: `❌ **Error al auditar leads:** ${err.message}`,
      };
    }
  }

  /**
   * Inspects recent security and audit events from the immutable spine
   */
  public static async inspectSystemLogs(options?: { limit?: number }): Promise<SecurityLogsReport> {
    const limit = options?.limit || 8;

    try {
      const records = await db.query.hermesSecurityEvents.findMany({
        orderBy: [desc(hermesSecurityEvents.createdAt)],
        limit,
      });

      const events = records.map((e) => ({
        id: e.id,
        organizationId: e.organizationId,
        eventType: e.eventType,
        severity: e.severity,
        policyDecision: e.policyDecision,
        correlationId: e.correlationId,
        createdAt: e.createdAt,
      }));

      const mdLines: string[] = [
        `# 🛡️ AUDITORÍA DE SEGURIDAD & EVENTOS DE RUNTIME`,
        `*Total de eventos recuperados: ${events.length}*`,
        '',
      ];

      if (events.length === 0) {
        mdLines.push('✅ No hay eventos críticos ni anomalías registradas recientemente. Todos los componentes operan en verde.');
      } else {
        mdLines.push('| Evento | Severidad | Decisión | Organización | Correlación | Fecha |');
        mdLines.push('|---|---|---|---|---|---|');
        for (const ev of events) {
          const dateStr = new Date(ev.createdAt).toLocaleTimeString();
          mdLines.push(
            `| \`${ev.eventType}\` | ${ev.severity} | ${ev.policyDecision} | \`${ev.organizationId}\` | \`${ev.correlationId.slice(0, 16)}\` | ${dateStr} |`
          );
        }
      }

      return {
        total: events.length,
        events,
        markdown: mdLines.join('\n'),
      };
    } catch (err: any) {
      console.error('[ExecutiveAuditService] Error inspecting security logs:', err);
      return {
        total: 0,
        events: [],
        markdown: `❌ **Error al consultar logs de seguridad:** ${err.message}`,
      };
    }
  }

  /**
   * Inspects database schema parity directly from information_schema
   */
  public static async inspectSchemaParity(): Promise<SchemaParityReport> {
    const columnsToCheck = [
      { table: 'scheduling_slots', column: 'reserved_until' },
      { table: 'scheduling_slots', column: 'reserved_by' },
      { table: 'nexus_collaborators', column: 'status' },
      { table: 'nexus_collaborators', column: 'whatsapp_phone' },
      { table: 'nexus_collaborators', column: 'discord_user_id' },
      { table: 'hermes_tenant_credits', column: 'credit_balance_usd' },
    ];

    const results: { table: string; column: string; exists: boolean; dataType?: string }[] = [];

    try {
      const rows: any = await db.execute(sql`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND (
            (table_name = 'scheduling_slots' AND column_name IN ('reserved_until', 'reserved_by'))
            OR (table_name = 'nexus_collaborators' AND column_name IN ('status', 'whatsapp_phone', 'discord_user_id'))
            OR (table_name = 'hermes_tenant_credits' AND column_name = 'credit_balance_usd')
          );
      `);

      const foundSet = new Set(
        (rows?.rows || rows || []).map((r: any) => `${r.table_name}.${r.column_name}`)
      );

      for (const target of columnsToCheck) {
        const key = `${target.table}.${target.column}`;
        const match = (rows?.rows || rows || []).find((r: any) => `${r.table_name}.${r.column_name}` === key);
        results.push({
          table: target.table,
          column: target.column,
          exists: foundSet.has(key),
          dataType: match?.data_type,
        });
      }

      const allInParity = results.every((r) => r.exists);

      const mdLines: string[] = [
        `# 🗄️ PARIDAD DE ESQUEMA EN NEON POSTGRESQL`,
        `*Estado General: ${allInParity ? '✅ 100% EN PARIDAD (SIN DRIFT)' : '⚠️ DRIFT DETECTADO'}*`,
        '',
        '| Tabla | Columna | Estado | Tipo de Dato |',
        '|---|---|---|---|',
      ];

      for (const r of results) {
        mdLines.push(
          `| \`${r.table}\` | \`${r.column}\` | ${r.exists ? '✅ ONLINE' : '❌ FALTANTE'} | ${r.dataType || '-'} |`
        );
      }

      return {
        checkedAt: new Date().toISOString(),
        allInParity,
        checkedColumns: results,
        markdown: mdLines.join('\n'),
      };
    } catch (err: any) {
      console.error('[ExecutiveAuditService] Error checking schema parity:', err);
      return {
        checkedAt: new Date().toISOString(),
        allInParity: false,
        checkedColumns: [],
        markdown: `❌ **Error al verificar paridad de base de datos:** ${err.message}`,
      };
    }
  }
}
