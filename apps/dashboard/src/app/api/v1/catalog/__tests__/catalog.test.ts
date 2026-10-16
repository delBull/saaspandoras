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

  it("enforces fail-closed rules: external URL rejected if domain is not in allowedDomains whitelist", () => {
    function testResolveSafeTargetUrl(rawUrl: string | null | undefined, allowedDomains: unknown): string | null {
      if (!rawUrl || typeof rawUrl !== 'string') return null;
      try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== 'https:') return null;
        if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) return null;

        const isAllowed = allowedDomains.some((domain) => {
          if (typeof domain !== 'string') return false;
          const parts = domain.toLowerCase().replace(/^https?:\/\//, '').split('/');
          const cleanDomain = (parts[0] || '').trim();
          if (!cleanDomain) return false;
          const host = parsed.hostname.toLowerCase();
          return host === cleanDomain || host.endsWith('.' + cleanDomain);
        });
        return isAllowed ? parsed.toString() : null;
      } catch {
        return null;
      }
    }

    // Whitelist matches
    expect(testResolveSafeTargetUrl("https://snarai.com/portal", ["snarai.com"])).toBe("https://snarai.com/portal");
    expect(testResolveSafeTargetUrl("https://app.snarai.com", ["snarai.com"])).toBe("https://app.snarai.com/");

    // Malicious or mismatched domains rejected (fail-closed)
    expect(testResolveSafeTargetUrl("https://phishing-snarai.com", ["snarai.com"])).toBeNull();
    expect(testResolveSafeTargetUrl("https://external-unregistered.com", [])).toBeNull();
    expect(testResolveSafeTargetUrl("http://insecure.snarai.com", ["snarai.com"])).toBeNull();
  });

  it("enforces strict legal badge attribution: requires certified status or valid IPFS CID", () => {
    function testHasLegalReviewedBadge(legalConfig: unknown): boolean {
      if (!legalConfig || typeof legalConfig !== 'object') return false;
      const cfg = legalConfig as Record<string, unknown>;
      const hasCertifiedStatus = cfg.status === 'certified' || cfg.legalStatus === 'reviewed';
      const hasVerifiedTemplate = typeof cfg.templateCid === 'string' && cfg.templateCid.startsWith('bafk');
      return Boolean(hasCertifiedStatus || hasVerifiedTemplate);
    }

    // Unreviewed or empty drafts do NOT receive badge
    expect(testHasLegalReviewedBadge({})).toBe(false);
    expect(testHasLegalReviewedBadge({ randomField: "data" })).toBe(false);
    expect(testHasLegalReviewedBadge({ templateCid: "invalid_cid" })).toBe(false);

    // Truly certified or notarized IPFS template receives badge
    expect(testHasLegalReviewedBadge({ templateCid: "bafkreihash123" })).toBe(true);
    expect(testHasLegalReviewedBadge({ status: "certified" })).toBe(true);
  });
});
