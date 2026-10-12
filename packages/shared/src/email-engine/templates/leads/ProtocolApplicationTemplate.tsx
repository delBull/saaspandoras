import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface ProtocolApplicationTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
}

export const ProtocolApplicationTemplate = ({
  branding,
  name,
}: ProtocolApplicationTemplateProps) => {
  return (
    <EmailLayoutShell
      previewText="Gracias por aplicar a Pandora’s W2E — paso siguiente"
      branding={branding}
      footerProfile="platform"
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
        Paso Siguiente
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "15px",
          lineHeight: "1.6",
          marginTop: 0,
        }}
      >
        Hola <strong>{name}</strong>,
      </Text>

      <Text
        style={{
          color: emailTheme.colors.textSecondary,
          fontSize: "15px",
          lineHeight: "1.6",
        }}
      >
        <strong>Recibimos tu aplicación correctamente.</strong><br />
        Nuestro equipo revisa solicitudes en menos de 24h para asegurar que tu proyecto encaja con nuestra infraestructura operativa y tecnológica.
      </Text>

      <EmailInfoCard title="🔎 ¿Qué sucede ahora?" titleColor={branding.accentColor}>
        <Text style={{ margin: "4px 0", color: emailTheme.colors.textPrimary, fontSize: "14px", lineHeight: "1.6" }}>
          Revisaremos tu aplicación en breve. Si tu proyecto califica, recibirás una invitación para agendar una llamada estratégica de alineación técnica y comercial.
        </Text>
      </EmailInfoCard>
    </EmailLayoutShell>
  );
};
