import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailButton } from "../../../email-components/EmailButton";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface AmbassadorWelcomeTemplateProps {
  branding: CanonicalEmailBranding;
  ambassadorName: string;
  referralCode: string;
  roleName: string;
  hubUrl?: string;
}

export const AmbassadorWelcomeTemplate = ({
  branding,
  ambassadorName,
  referralCode,
  roleName,
  hubUrl,
}: AmbassadorWelcomeTemplateProps) => {
  const isPandoras = branding.isPandorasPlatform !== false;
  const previewText = `¡Bienvenido como ${roleName} oficial de ${branding.name}! 🚀`;

  return (
    <EmailLayoutShell
      previewText={previewText}
      branding={branding}
      footerProfile={isPandoras ? "platform" : "tenant"}
    >
      <Heading
        as="h2"
        style={{
          margin: "0 0 16px 0",
          color: branding.accentColor || emailTheme.colors.accentDefault,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {`Programa Oficial de ${roleName}s`}
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "16px",
          lineHeight: "1.6",
          marginTop: 0,
        }}
      >
        Hola <strong>{ambassadorName}</strong>,
      </Text>

      <Text
        style={{
          color: emailTheme.colors.textSecondary,
          fontSize: "15px",
          lineHeight: "1.6",
        }}
      >
        Tu registro como {roleName} oficial de <strong>{branding.name}</strong> ha sido confirmado exitosamente.
        Bienvenido a nuestro equipo de socios comerciales.
      </Text>

      <EmailInfoCard title="Tu Código Oficial de Referido" titleColor={branding.accentColor}>
        <div
          style={{
            fontSize: "26px",
            fontFamily: emailTheme.typography.monoFamily,
            fontWeight: 800,
            color: branding.accentColor,
            letterSpacing: "0.1em",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          {referralCode}
        </div>
      </EmailInfoCard>

      <Text
        style={{
          color: emailTheme.colors.textSecondary,
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        Comparte tu código con tus clientes y prospectos para que puedan registrarse en la plataforma y comenzar a operar de forma coordinada.
      </Text>

      {hubUrl && (
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <EmailButton href={hubUrl} customColor={branding.accentColor}>
            Acceder al Hub Comercial
          </EmailButton>
        </Section>
      )}

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "12px",
          textAlign: "center",
          margin: "24px 0 0 0",
        }}
      >
        En los próximos días recibirás soporte directo de nuestro equipo de operaciones para resolver cualquier duda.
      </Text>
    </EmailLayoutShell>
  );
};
