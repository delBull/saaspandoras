import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../engine/EmailLayoutShell";
import { EmailButton } from "../../components/EmailButton";
import { CanonicalEmailBranding } from "../../engine/types";
import { emailTheme } from "../../engine/theme";

export interface MagicLinkEmailTemplateProps {
  branding: CanonicalEmailBranding;
  magicUrl: string;
  portalName?: string;
  expirationMinutes?: number;
}

export const MagicLinkEmailTemplate = ({
  branding,
  magicUrl,
  portalName = "Sovereign Sign Portal",
  expirationMinutes = 15,
}: MagicLinkEmailTemplateProps) => {
  return (
    <EmailLayoutShell
      previewText="Tu enlace de acceso seguro — Pandora's"
      branding={branding}
      footerProfile="identity"
    >
      <Heading
        as="h2"
        style={{
          margin: "0 0 12px 0",
          color: branding.accentColor || emailTheme.colors.accentDefault,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {portalName}
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "12px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 24px 0",
        }}
      >
        Acceso Seguro & Inviolable con Magic Link
      </Text>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "15px",
          lineHeight: "1.6",
          textAlign: "center",
          margin: "0 0 24px 0",
        }}
      >
        Haz clic en el botón inferior para ingresar de forma segura a tu cuenta en el{" "}
        <strong>{portalName}</strong>.
      </Text>

      <Section style={{ textAlign: "center", margin: "28px 0" }}>
        <EmailButton href={magicUrl} customColor={branding.accentColor || emailTheme.colors.accentGold}>
          INGRESAR A MI PORTAL →
        </EmailButton>
      </Section>

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "12px",
          textAlign: "center",
          lineHeight: "1.6",
          fontFamily: emailTheme.typography.monoFamily,
          margin: "24px 0 0 0",
        }}
      >
        {`Este enlace expira en ${expirationMinutes} minutos y es de un solo uso.`}<br />
        Si no solicitaste este acceso, puedes ignorar este correo.
      </Text>
    </EmailLayoutShell>
  );
};
