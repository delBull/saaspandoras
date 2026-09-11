import { describe, it, expect } from 'vitest';
import {
  ECOSYSTEM_STATIONS,
  getStationsForRole,
  generateTourShareLink,
  generateWhatsAppShareText,
  getHermesAnswerForStation,
  type EcosystemTourRole,
} from '../ecosystem-guides.data';

describe('🧭 Nexus Onboarding Data & Logic (Hermes Tour)', () => {
  it('should have 6 canonical onboarding stations including Sovereign Agenda', () => {
    expect(ECOSYSTEM_STATIONS).toHaveLength(6);
    const stationIds = ECOSYSTEM_STATIONS.map((s) => s.id);
    expect(stationIds).toContain('nexus_core');
    expect(stationIds).toContain('nexus_growth');
    expect(stationIds).toContain('nexus_access');
    expect(stationIds).toContain('nexus_resources');
    expect(stationIds).toContain('nexus_cognitive');
    expect(stationIds).toContain('nexus_scheduling');
  });

  it('should enforce RBAC filtering: SUPER_ADMIN sees all 6 stations', () => {
    const superAdminStations = getStationsForRole('SUPER_ADMIN');
    expect(superAdminStations).toHaveLength(6);
  });

  it('should enforce RBAC filtering: VIEWER only sees permitted stations (no Access, Cognitive)', () => {
    const collabStations = getStationsForRole('VIEWER');
    const ids = collabStations.map((s) => s.id);
    expect(ids).toContain('nexus_core');
    expect(ids).toContain('nexus_resources');
    expect(ids).not.toContain('nexus_access');
    expect(ids).not.toContain('nexus_cognitive');
  });

  it('should generate valid deep links with role parameter', () => {
    const linkAdmin = generateTourShareLink('ADMIN', 'https://dash.pandoras.finance');
    expect(linkAdmin).toBe('https://dash.pandoras.finance/nexus?tour=ecosystem&role=admin');

    const linkViewer = generateTourShareLink('VIEWER');
    expect(linkViewer).toContain('/nexus?tour=ecosystem&role=viewer');
  });

  it('should generate formatted WhatsApp invite text containing role and station list', () => {
    // 1-arg variant: auto-generates link
    const waText = generateWhatsAppShareText('ADMIN');
    expect(waText).toContain('*ADMIN*');
    expect(waText).toContain('Core Protocol');
    expect(waText).toContain('/nexus?tour=ecosystem&role=admin');

    // 2-arg variant used by AdminEcosystemGuidesView
    const customLink = 'https://dash.pandoras.finance/nexus?tour=ecosystem&role=admin';
    const waText2 = generateWhatsAppShareText('ADMIN', customLink);
    expect(waText2).toContain(customLink);
  });

  it('should provide intelligent answers from Hermes for station queries', () => {
    const coreStation = ECOSYSTEM_STATIONS.find((s) => s.id === 'nexus_core')!;

    // FAQ matching
    const faqAnswer = getHermesAnswerForStation(coreStation, '¿Cómo se garantiza la validez legal?');
    expect(faqAnswer).toContain("SHA-256");

    // General fallback
    const generalAnswer = getHermesAnswerForStation(coreStation, '¿Qué hace esto?');
    expect(generalAnswer).toBeTruthy();

    // Greeting
    const greetingAnswer = getHermesAnswerForStation(coreStation, 'Hola Hermes');
    expect(greetingAnswer).toContain('Hermes');
  });
});
