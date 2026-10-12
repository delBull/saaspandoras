import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface BookingPendingTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  dateStr: string;
  timeStr: string;
  brandName: string;
}

export const BookingPendingTemplate = ({
  branding,
  name,
  dateStr,
  timeStr,
  brandName,
}: BookingPendingTemplateProps) => {
  const isPandoras = branding.isPandorasPlatform !== false;
  const headerTitle = isPandoras
    ? "Solicitud de Agenda Recibida"
    : `Solicitud Recibida - ${brandName}`;
  const previewText = `🗓️ ${headerTitle}`;

  return (
    <EmailLayoutShell
      previewText={previewText}
      branding={branding}
      footerProfile={isPandoras ? "platform" : "tenant"}
    >
      <Heading
        as="h2"
        style={{
          margin: "0 0 18px 0",
          color: branding.accentColor || emailTheme.colors.accentGold,
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {headerTitle}
      </Heading>

      <Text
        style={{
          color: emailTheme.colors.textPrimary,
          fontSize: "16px",
          marginTop: 0,
          lineHeight: "1.6",
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
        Hemos reservado tu espacio provisionalmente. Nuestro equipo está coordinando los
        detalles y recibirás la confirmación definitiva con el enlace de acceso.
      </Text>

      <Section style={{ marginTop: "20px", marginBottom: "24px" }}>
        <EmailInfoCard title="Detalles de la Sesión">
          <p style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "15px" }}>
            <strong>Fecha:</strong> {dateStr}
          </p>
          <p style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "15px" }}>
            <strong>Hora:</strong> {timeStr}
          </p>
          <p style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "15px" }}>
            <strong>Organizador:</strong> {brandName}
          </p>
        </EmailInfoCard>
      </Section>

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "13px",
          marginBottom: 0,
        }}
      >
        Si necesitas reagendar o tienes consultas previas, por favor responde a este correo.
      </Text>
    </EmailLayoutShell>
  );
};