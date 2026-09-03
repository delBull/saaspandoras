import { describe, it, expect } from 'vitest';
import {
  ECOSYSTEM_STATIONS,
  getStationsForRole,
  generateTourShareLink,
  generateWhatsAppShareText,
  getHermesAnswerForStation,
  type EcosystemTourRole,
} from '../ecosystem-guides.data';

describe('🧭 Ecosystem Guides Data & Logic (Hermes Tour)', () => {
  it('should have 7 canonical ecosystem stations', () => {
    expect(ECOSYSTEM_STATIONS).toHaveLength(7);
    const stationIds = ECOSYSTEM_STATIONS.map((s) => s.id);
    expect(stationIds).toContain('nexus_identity');
    expect(stationIds).toContain('deal_rooms');
    expect(stationIds).toContain('growth_os_crm');
    expect(stationIds).toContain('rwa_capital');
    expect(stationIds).toContain('investor_portals');
    expect(stationIds).toContain('platform_governance');
    expect(stationIds).toContain('academy_vault');
  });

  it('should enforce RBAC filtering: SUPER_ADMIN sees all stations', () => {
    const superAdminStations = getStationsForRole('SUPER_ADMIN');
    expect(superAdminStations).toHaveLength(7);
  });

  it('should enforce RBAC filtering: COLLABORATOR only sees permitted stations (no Deal Rooms, Governance, Academy)', () => {
    const collabStations = getStationsForRole('COLLABORATOR');
    const ids = collabStations.map((s) => s.id);
    expect(ids).toContain('nexus_identity');
    expect(ids).toContain('growth_os_crm');
    expect(ids).toContain('investor_portals');
    expect(ids).not.toContain('platform_governance');
    expect(ids).not.toContain('deal_rooms');
    expect(ids).not.toContain('academy_vault');
  });

  it('should generate valid deep links with role parameter', () => {
    const linkManager = generateTourShareLink('MANAGER', 'https://dash.pandoras.finance');
    expect(linkManager).toBe('https://dash.pandoras.finance/nexus?tour=ecosystem&role=manager');

    const linkCollab = generateTourShareLink('COLLABORATOR');
    expect(linkCollab).toContain('/nexus?tour=ecosystem&role=collaborator');
  });

  it('should generate formatted WhatsApp invite text containing role and station list', () => {
    const waText = generateWhatsAppShareText('ADMIN');
    expect(waText).toContain('*ADMIN*');
    expect(waText).toContain('Deal Rooms & Legal Institucional');
    expect(waText).toContain('https://dash.pandoras.finance/nexus?tour=ecosystem&role=admin');
  });

  it('should provide intelligent answers from Hermes for station queries', () => {
    const dealRooms = ECOSYSTEM_STATIONS.find((s) => s.id === 'deal_rooms')!;

    // Exact or FAQ matching
    const faqAnswer = getHermesAnswerForStation(dealRooms, '¿Cómo se garantiza la validez legal?');
    expect(faqAnswer).toContain('SHA-256');

    // Security keyword matching
    const secAnswer = getHermesAnswerForStation(dealRooms, '¿Es seguro el proceso legal?');
    expect(secAnswer).toContain('seguridad');

    // General fallback
    const generalAnswer = getHermesAnswerForStation(dealRooms, '¿Qué hace esto?');
    expect(generalAnswer).toContain('Hermes AI');
  });
});
