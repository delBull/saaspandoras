import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../engine/EmailLayoutShell";
import { EmailButton } from "../../components/EmailButton";
import { EmailInfoCard } from "../../components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../engine/types";
import { emailTheme } from "../../engine/theme";

export interface ClientActivationTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  projectName: string;
  dashboardLink: string;
}

export const ClientActivationTemplate = ({
  branding,
  name,
  projectName,
  dashboardLink,
}: ClientActivationTemplateProps) => {
  return (
    <EmailLayoutShell
      previewText="¡Bienvenido a Pandora's! Tu lugar está asegurado 🚀"
      branding={branding}
      footerProfile="transactional"
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
        {`¡Bienvenido, ${name}!`}
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "15px",
          lineHeight: "1.6",
          marginTop: 0,
        }}
      >
        Hemos confirmado tu aportación y tu fase de análisis ha comenzado oficialmente.
      </Text>

      <Text
        style={{
          color: emailTheme.colors.textSecondary,
          fontSize: "15px",
          lineHeight: "1.6",
        }}
      >
        Tu proyecto <strong>{projectName}</strong> ha sido activado en nuestro sistema.
        Nuestro equipo técnico ya ha recibido la confirmación y comenzará la revisión de tu arquitectura.
      </Text>

      <EmailInfoCard title="Siguientes Pasos (24-48h):" titleColor={branding.accentColor}>
        <Text style={{ margin: "4px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          1. Asignación de un Arquitecto de Soluciones.
        </Text>
        <Text style={{ margin: "4px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          2. Creación de tu canal privado de comunicación.
        </Text>
        <Text style={{ margin: "4px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          3. Envío del SOW (Scope of Work) preliminar.
        </Text>
      </EmailInfoCard>

      <Section style={{ textAlign: "center", margin: "28px 0" }}>
        <EmailButton href={dashboardLink} customColor={branding.accentColor}>
          Ir a mi Dashboard
        </EmailButton>
      </Section>
    </EmailLayoutShell>
  );
};
