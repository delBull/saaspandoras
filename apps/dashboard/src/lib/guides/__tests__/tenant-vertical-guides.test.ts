import { describe, it, expect } from 'vitest';
import {
  TENANT_VERTICALS_CONFIG,
  getStationsForTenantVertical,
  generateTenantTourShareLink,
  generateTenantWhatsAppShareText,
} from '../tenant-vertical-guides.data';

describe('🧭 Tenant Vertical Guides Data & Logic', () => {
  it('should define the 3 core tenant verticals', () => {
    expect(TENANT_VERTICALS_CONFIG).toHaveLength(3);
    const ids = TENANT_VERTICALS_CONFIG.map((v) => v.id);
    expect(ids).toContain('RWA_REAL_ESTATE');
    expect(ids).toContain('SAAS_GROWTH');
    expect(ids).toContain('CREATOR_COMMUNITY');
  });

  it('should return 5 tailored stations for RWA_REAL_ESTATE with dynamic slug in targetUrls', () => {
    const rwaStations = getStationsForTenantVertical('RWA_REAL_ESTATE', 'tulum-villas');
    expect(rwaStations).toHaveLength(5);
    expect(rwaStations[0]!.targetUrl).toContain('/profile/projects/tulum-villas/manage');
    expect(rwaStations[1]!.targetUrl).toContain('/portal/tulum-villas/knowledge');
    expect(rwaStations[3]!.targetUrl).toContain('/portal/tulum-villas');
  });

  it('should return 4 tailored stations for SAAS_GROWTH', () => {
    const saasStations = getStationsForTenantVertical('SAAS_GROWTH', 'acme-corp');
    expect(saasStations).toHaveLength(4);
    const ids = saasStations.map((s) => s.id);
    expect(ids).toContain('saas_inbound_channels');
    expect(ids).toContain('saas_hermes_prompts');
  });

  it('should return 3 tailored stations for CREATOR_COMMUNITY', () => {
    const creatorStations = getStationsForTenantVertical('CREATOR_COMMUNITY', 'alpha-club');
    expect(creatorStations).toHaveLength(3);
    const ids = creatorStations.map((s) => s.id);
    expect(ids).toContain('creator_token_memberships');
  });

  it('should generate deep links for tenant onboarding', () => {
    const link = generateTenantTourShareLink('RWA_REAL_ESTATE', 'snarai', 'https://dash.pandoras.finance');
    expect(link).toBe('https://dash.pandoras.finance/ecosystem/snarai?tour=setup&vertical=rwa_real_estate');
  });

  it('should generate WhatsApp invitation with tenant slug and vertical name', () => {
    const waText = generateTenantWhatsAppShareText('RWA_REAL_ESTATE', 'snarai');
    expect(waText).toContain('SNARAI');
    expect(waText).toContain('Real Estate & Inversión Fraccionada');
    expect(waText).toContain('https://dash.pandoras.finance/ecosystem/snarai?tour=setup&vertical=rwa_real_estate');
  });
});
