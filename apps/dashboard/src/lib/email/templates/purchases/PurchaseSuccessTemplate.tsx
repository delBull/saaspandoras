import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../engine/EmailLayoutShell";
import { EmailButton } from "../../components/EmailButton";
import { EmailInfoCard } from "../../components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../engine/types";
import { emailTheme } from "../../engine/theme";

export interface PurchaseSuccessTemplateProps {
  branding: CanonicalEmailBranding;
  amount: number;
  isReturning: boolean;
  portalUrl: string;
  projectName: string;
}

export const PurchaseSuccessTemplate = ({
  branding,
  amount,
  isReturning,
  portalUrl,
  projectName,
}: PurchaseSuccessTemplateProps) => {
  const title = isReturning ? "Nuevos Títulos Adquiridos" : "¡Felicidades por tu Participación!";
  const previewText = isReturning 
    ? `📜 Adición de Títulos Confirmada - ${projectName}`
    : `🎉 Bienvenido a ${projectName} - Participación Confirmada`;

  return (
    <EmailLayoutShell
      previewText={previewText}
      branding={branding}
      footerProfile="transactional"
    >
      <Heading
        as="h2"
        style={{
          margin: "0 0 16px 0",
          color: emailTheme.colors.textPrimary,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {title}
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "16px",
          lineHeight: "1.6",
          marginTop: 0,
        }}
      >
        {isReturning ? (
          <>
            Has adquirido exitosamente{" "}
            <strong style={{ color: branding.accentColor }}>{amount} título(s) adicionales</strong> en{" "}
            {projectName}. Tu portafolio ha sido actualizado.
          </>
        ) : (
          <>
            Bienvenido a la comunidad de <strong>{projectName}</strong>. Has adquirido{" "}
            <strong style={{ color: branding.accentColor }}>{amount} título(s) de participación</strong>{" "}
            exitosamente.
          </>
        )}
      </Text>

      <EmailInfoCard title="Certificación Soberana" titleColor={branding.accentColor}>
        <Text
          style={{
            margin: 0,
            color: emailTheme.colors.textSecondary,
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          Tus certificados digitales se han emitido y registrado inmutablemente. Puedes visualizarlos,
          descargarlos en PDF y revisar tu estado general desde tu Portal de Gestión.
        </Text>
      </EmailInfoCard>

      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={portalUrl} variant="emerald" customColor={branding.accentColor}>
          Acceder a Mi Portal
        </EmailButton>
      </Section>

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "12px",
          textAlign: "center",
          margin: "24px 0 0 0",
        }}
      >
        Si no solicitaste esta participación, por favor ignora este correo.
      </Text>
    </EmailLayoutShell>
  );
};
