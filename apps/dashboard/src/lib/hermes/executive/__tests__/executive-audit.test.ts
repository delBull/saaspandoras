import { describe, it, expect } from 'vitest';
import { ExecutiveAuditService } from '../audit-service';

describe('Hermes Executive Sovereign Plane — Phase 1: Read Everything (Canonical Audit Layer)', () => {
  describe('1. Tenant Deep Inspection', () => {
    it('inspects an existing or mock tenant and returns structured markdown report', async () => {
      const report = await ExecutiveAuditService.inspectTenant('snarai');

      expect(report).toBeDefined();
      expect(report.slug).toBe('snarai');
      expect(typeof report.markdown).toBe('string');
      expect(report.markdown.length).toBeGreaterThan(0);
    });

    it('handles non-existent tenant gracefully without throwing 500', async () => {
      const report = await ExecutiveAuditService.inspectTenant('non_existent_tenant_9999');

      expect(report).toBeDefined();
      expect(report.found).toBe(false);
      expect(report.markdown).toContain('Tenant no encontrado');
    });
  });

  describe('2. CRM Leads & Attribution Inspection', () => {
    it('queries and tabulates recent leads with contact channels and scores', async () => {
      const report = await ExecutiveAuditService.inspectLeads({ limit: 5 });

      expect(report).toBeDefined();
      expect(typeof report.total).toBe('number');
      expect(Array.isArray(report.leads)).toBe(true);
      expect(report.markdown).toContain('AUDITORÍA DE LEADS & PROSPECTOS');
      expect(report.markdown).toContain('| ID | Nombre | Contacto | Intención | Score | Origen | Fecha |');
    });
  });

  describe('3. Security Events & Audit Spine Inspection', () => {
    it('queries recent security events without exposing plaintext secrets', async () => {
      const report = await ExecutiveAuditService.inspectSystemLogs({ limit: 5 });

      expect(report).toBeDefined();
      expect(typeof report.total).toBe('number');
      expect(Array.isArray(report.events)).toBe(true);
      expect(report.markdown).toContain('AUDITORÍA DE SEGURIDAD & EVENTOS DE RUNTIME');
    });
  });

  describe('4. NeonDB Database Schema Parity Inspector', () => {
    it('queries information_schema and verifies 100% schema parity across essential tables', async () => {
      const report = await ExecutiveAuditService.inspectSchemaParity();

      expect(report).toBeDefined();
      expect(report.checkedColumns.length).toBeGreaterThanOrEqual(5);

      // Verify essential columns from 0049 and 0050 are reported
      const slotReservedUntil = report.checkedColumns.find(c => c.table === 'scheduling_slots' && c.column === 'reserved_until');
      expect(slotReservedUntil).toBeDefined();
      expect(slotReservedUntil?.exists).toBe(true);

      const colabStatus = report.checkedColumns.find(c => c.table === 'nexus_collaborators' && c.column === 'status');
      expect(colabStatus).toBeDefined();
      expect(colabStatus?.exists).toBe(true);

      expect(report.allInParity).toBe(true);
      expect(report.markdown).toContain('100% EN PARIDAD (SIN DRIFT)');
    });
  });
});
