import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";
import { CanonicalEmailBranding, EmailFooterProfile } from "./types";
import { emailTheme } from "./theme";

export interface EmailLayoutShellProps {
  previewText?: string;
  branding: CanonicalEmailBranding;
  footerProfile?: EmailFooterProfile;
  customLegalNotice?: React.ReactNode;
  children: React.ReactNode;
}

export const EmailLayoutShell = ({
  previewText,
  branding,
  footerProfile = "platform",
  customLegalNotice,
  children,
}: EmailLayoutShellProps) => {
  const isPandoras = branding.isPandorasPlatform !== false;

  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: emailTheme.colors.canvas,
          fontFamily: emailTheme.typography.fontFamily,
          color: emailTheme.colors.textPrimary,
          margin: "0 auto",
          padding: "24px 12px",
        }}
      >
        <Container
          style={{
            maxWidth: `${emailTheme.layout.maxWidth}px`,
            margin: "0 auto",
            backgroundColor: emailTheme.colors.cardBackground,
            border: `1px solid ${emailTheme.colors.cardBorder}`,
            borderRadius: emailTheme.layout.borderRadius,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "28px 24px 20px 24px",
              textAlign: "center",
              borderBottom: `1px solid ${emailTheme.colors.cardBorder}`,
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={branding.name}
                width="140"
                style={{ margin: "0 auto 8px auto", display: "block" }}
              />
            ) : (
              <Text
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: branding.accentColor || emailTheme.colors.accentDefault,
                  textTransform: "uppercase",
                }}
              >
                {branding.name}
              </Text>
            )}
            <Text
              style={{
                margin: "4px 0 0 0",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: emailTheme.colors.textMuted,
              }}
            >
              {isPandoras ? "Sovereign Infrastructure" : "Sovereign Client Portal"}
            </Text>
          </Section>

          {/* Main Body Content */}
          <Section style={{ padding: emailTheme.layout.contentPadding }}>
            {children}
          </Section>

          {/* Contextual Legal Footer */}
          <Section
            style={{
              padding: "24px",
              borderTop: `1px solid ${emailTheme.colors.cardBorder}`,
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
          >
            {customLegalNotice && (
              <div style={{ marginBottom: "16px" }}>{customLegalNotice}</div>
            )}

            {/* Profile-Specific Footers */}
            {footerProfile === "transactional" && (
              <>
                <Text
                  style={{
                    fontSize: "11px",
                    color: emailTheme.colors.textMuted,
                    lineHeight: "1.5",
                    margin: "0 0 12px 0",
                  }}
                >
                  Este recibo certifica la asignación y custodia de los derechos correspondientes.
                  Al participar, aceptas los acuerdos marco de custodia y términos de liquidación.
                </Text>
                {branding.legalUrls && (
                  <Text style={{ margin: "0 0 14px 0", fontSize: "11px" }}>
                    {branding.legalUrls.agreement && (
                      <Link
                        href={branding.legalUrls.agreement}
                        style={{ color: branding.accentColor, textDecoration: "none", margin: "0 6px" }}
                      >
                        Acuerdo Marco
                      </Link>
                    )}
                    {branding.legalUrls.riskDisclosure && (
                      <Link
                        href={branding.legalUrls.riskDisclosure}
                        style={{ color: branding.accentColor, textDecoration: "none", margin: "0 6px" }}
                      >
                        • Aviso de Riesgos
                      </Link>
                    )}
                    {branding.legalUrls.phaseDynamics && (
                      <Link
                        href={branding.legalUrls.phaseDynamics}
                        style={{ color: branding.accentColor, textDecoration: "none", margin: "0 6px" }}
                      >
                        • Anexo Comercial
                      </Link>
                    )}
                  </Text>
                )}
              </>
            )}

            {footerProfile === "identity" && (
              <Text
                style={{
                  fontSize: "11px",
                  color: emailTheme.colors.textMuted,
                  lineHeight: "1.5",
                  margin: "0 0 12px 0",
                }}
              >
                🔒 Este correo contiene un enlace de autenticación único y confidencial.
                Si no solicitaste este acceso, ninguna acción es requerida; tus credenciales se mantienen seguras.
              </Text>
            )}

            {footerProfile === "tenant" && (
              <Text
                style={{
                  fontSize: "12px",
                  color: emailTheme.colors.textSecondary,
                  lineHeight: "1.5",
                  margin: "0 0 10px 0",
                }}
              >
                {branding.name} • Gestión de Citas y Relación Comercial
              </Text>
            )}

            {/* Platform watermark attribution */}
            <Text
              style={{
                fontSize: "11px",
                color: emailTheme.colors.textFaint,
                margin: "12px 0 0 0",
                lineHeight: "1.4",
              }}
            >
              {isPandoras ? (
                <>Pandora's Growth OS • Sovereign Capital & Growth Infrastructure</>
              ) : (
                <>
                  Coordinado mediante <strong>Pandora's Growth OS</strong> • Infraestructura Soberana
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
