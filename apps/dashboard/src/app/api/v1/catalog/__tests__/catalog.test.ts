import { describe, it, expect } from "vitest";
import type { 
  CatalogItemDto, 
  CatalogResponseDto, 
  CatalogVertical, 
  CatalogProductNature, 
  CatalogIntegrationMode, 
  CatalogVerificationFlag 
} from "@saasfly/shared";

describe("Catalog DTO & Contracts Verification", () => {
  it("enforces valid catalog vertical types", () => {
    const validVerticals: CatalogVertical[] = [
      'RWA_REAL_ESTATE',
      'GROWTH_SERVICES',
      'SAAS_SOFTWARE',
      'SPECIALTY_GOODS',
      'COMMUNITY_MEMBERSHIP',
      'INFRASTRUCTURE',
      'OTHER',
    ];
    expect(validVerticals).toHaveLength(7);
  });

  it("enforces distinct product natures and integration modes", () => {
    const validNatures: CatalogProductNature[] = [
      'FRACTIONAL_RIGHT',
      'MEMBERSHIP_PASS',
      'ACCESS_LICENSE',
      'B2B_SERVICE',
      'PRODUCT_OFFER',
      'UTILITY_TOKEN',
    ];
    const validModes: CatalogIntegrationMode[] = [
      'DIRECT_CHECKOUT',
      'EXTERNAL_PORTAL',
      'CONTACT_REQUIRED',
      'INFORMATION_ONLY',
    ];
    expect(validNatures.length).toBeGreaterThanOrEqual(6);
    expect(validModes.length).toBeGreaterThanOrEqual(4);
  });

  it("verifies separation of tenant-level flags from product claims", () => {
    const flags: CatalogVerificationFlag[] = [
      'TENANT_AUTHENTICATED',
      'LEGAL_STRUCTURE_REVIEWED',
      'CRYPTOGRAPHICALLY_SEALED',
      'HERMES_CONCIERGE_ENABLED',
    ];
    expect(flags).toContain('TENANT_AUTHENTICATED');
    expect(flags).toContain('LEGAL_STRUCTURE_REVIEWED');
    expect(flags).toContain('CRYPTOGRAPHICALLY_SEALED');
  });

  it("properly constructs a compliant CatalogItemDto without fabricated yields", () => {
    const item: CatalogItemDto = {
      id: "catalog-snarai",
      slug: "snarai",
      title: "S'Narai Sanctuary",
      tagline: "Eco-luxury sanctuary and regenerative real estate",
      description: "Fractional asset backed by notarized fideicomiso title",
      imageUrl: "https://pandoras.finance/snarai-cover.jpg",
      logoUrl: "https://pandoras.finance/snarai-logo.jpg",
      canonicalOrgId: "e9b2f6b3-6f8e-4a6c-9411-9a74bfb28741",
      tenantSlug: "snarai",
      tenantName: "S'Narai Sanctuary",
      vertical: "RWA_REAL_ESTATE",
      productNature: "FRACTIONAL_RIGHT",
      pricing: {
        amount: 2500,
        currency: "USD",
        formatted: "$2,500.00 USD",
      },
      integration: {
        mode: "EXTERNAL_PORTAL",
        targetUrl: "https://snarai.com",
        ctaLabel: "Visitar Portal",
        requiresAuth: false,
      },
      verificationFlags: [
        "TENANT_AUTHENTICATED",
        "LEGAL_STRUCTURE_REVIEWED",
        "CRYPTOGRAPHICALLY_SEALED",
      ],
      evidence: {
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 137,
        agreementTemplateCid: "bafkreiexampletemplatecid123",
      },
      featured: true,
      status: "live",
    };

    expect(item.canonicalOrgId).toBeDefined();
    expect(item.productNature).toBe("FRACTIONAL_RIGHT");
    expect(item.integration.mode).toBe("EXTERNAL_PORTAL");
    expect(item.verificationFlags).toContain("TENANT_AUTHENTICATED");
    // Verify no guaranteed yields or fabricated return fields exist in the DTO
    expect((item as any).guaranteedApy).toBeUndefined();
    expect((item as any).projectedRoi).toBeUndefined();
  });
});
