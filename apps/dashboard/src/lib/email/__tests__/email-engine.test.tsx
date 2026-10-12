import { describe, it, expect } from "vitest";
import { renderEmailAsync } from "../engine/render-email";
import { resolveEmailBranding, PANDORAS_DEFAULT_BRANDING } from "../engine/branding";
import { PurchaseSuccessTemplate } from "../templates/purchases/PurchaseSuccessTemplate";
import { BookingConfirmedTemplate } from "../templates/bookings/BookingConfirmedTemplate";
import { emailTheme } from "../engine/theme";

describe("📧 Email Engine & Templates Suite", () => {
  describe("1. Brand Resolution", () => {
    it("returns default platform branding when no tenant is passed", async () => {
      const brand = await resolveEmailBranding();
      expect(brand.name).toBe("Pandora's Growth OS");
      expect(brand.isPandorasPlatform).toBe(true);
      expect(brand.accentColor).toBe(emailTheme.colors.accentDefault);
      expect(brand.legalUrls?.terms).toContain("pandoras.finance");
    });

    it("respects explicit brand overrides gracefully", async () => {
      const brand = await resolveEmailBranding({
        explicitBrand: {
          name: "Forge Fitness",
          accentColor: "#f59e0b",
          isPandorasPlatform: false,
        }
      });
      expect(brand.name).toBe("Forge Fitness");
      expect(brand.isPandorasPlatform).toBe(false);
      expect(brand.accentColor).toBe("#f59e0b");
    });
  });

  describe("2. Render Pipeline", () => {
    it("renders PurchaseSuccessTemplate with transactional footer and legal links", async () => {
      const branding = {
        name: "S'Narai",
        isPandorasPlatform: false,
        accentColor: "#10b981",
        legalUrls: {
          agreement: "https://dash.pandoras.finance/legal/agreement/snarai",
          riskDisclosure: "https://dash.pandoras.finance/legal/risk/snarai",
          phaseDynamics: "https://dash.pandoras.finance/legal/phase/snarai",
        }
      };

      const { html, text } = await renderEmailAsync({
        template: PurchaseSuccessTemplate,
        props: {
          branding,
          amount: 5,
          isReturning: false,
          portalUrl: "https://portal.snarai.com",
          projectName: "S'Narai",
        },
      });

      expect(html).toContain("S&#x27;Narai");
      expect(html).toContain("5");
      expect(html).toContain("de participaci");
      expect(html).toContain("Acuerdo Marco");
      expect(html).toContain("Aviso de Riesgos");
      expect(html).toContain("Anexo Comercial");
      expect(html).toContain("Coordinado mediante");
      expect(html).toContain("Pandora&#x27;s Growth OS");
      expect(html).toContain("Acceder a Mi Portal");
    });

    it("renders BookingConfirmedTemplate with appointment coordinates", async () => {
      const branding = {
        name: "Pandora's",
        isPandorasPlatform: true,
        accentColor: "#e4c875",
      };

      const { html } = await renderEmailAsync({
        template: BookingConfirmedTemplate,
        props: {
          branding,
          name: "Roberto Gómez",
          dateStr: "martes, 15 de octubre de 2026",
          timeStr: "10:30",
          meetingLink: "https://meet.google.com/pdr-sovereign-call",
          brandName: "Pandora's",
        },
      });

      expect(html).toContain("Cita Confirmada");
      expect(html).toContain("Roberto Gómez");
      expect(html).toContain("martes, 15 de octubre de 2026");
      expect(html).toContain("10:30");
      expect(html).toContain("https://meet.google.com/pdr-sovereign-call");
      expect(html).toContain("Unirse a la Reunión");
    });

    it("renders AmbassadorWelcomeTemplate with referral code and tenant branding", async () => {
      const branding = {
        name: "S'Narai",
        isPandorasPlatform: false,
        accentColor: "#10b981",
      };

      const { html } = await renderEmailAsync({
        template: (await import("../templates/ambassadors/AmbassadorWelcomeTemplate")).AmbassadorWelcomeTemplate,
        props: {
          branding,
          ambassadorName: "Valeria Gestora",
          referralCode: "SNARAI-VIP-88",
          roleName: "Gestor Patrimonial",
          hubUrl: "https://snarai.aztecaz.xyz/gestores/portal",
        },
      });

      expect(html).toContain("Valeria Gestora");
      expect(html).toContain("SNARAI-VIP-88");
      expect(html).toContain("Gestor Patrimonial");
      expect(html).toContain("Hub Comercial");
    });

    it("renders HermesNotificationTemplate with system status and action CTA", async () => {
      const branding = {
        name: "Pandora's Growth OS",
        isPandorasPlatform: true,
        accentColor: "#00F0FF",
      };

      const { html } = await renderEmailAsync({
        template: (await import("../templates/hermes/HermesNotificationTemplate")).HermesNotificationTemplate,
        props: {
          branding,
          title: "Grace Period Started",
          recipientName: "Marco",
          message: "Your subscription entered grace period.",
          ctaText: "Update Payment",
          ctaUrl: "https://dash.pandoras.finance/billing",
          badge: "Billing",
          type: "warning",
        },
      });

      expect(html).toContain("Grace Period Started");
      expect(html).toContain("Marco");
      expect(html).toContain("Update Payment");
      expect(html).toContain("Billing");
    });
  });
});
