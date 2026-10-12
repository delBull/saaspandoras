import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailButton } from "../../../email-components/EmailButton";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface BookingConfirmedTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  dateStr: string;
  timeStr: string;
  meetingLink?: string;
  brandName: string;
}

export const BookingConfirmedTemplate = ({
  branding,
  name,
  dateStr,
  timeStr,
  meetingLink,
  brandName,
}: BookingConfirmedTemplateProps) => {
  const isPandoras = branding.isPandorasPlatform !== false;
  const headerTitle = isPandoras ? "Cita Confirmada • Pandora's" : `Cita Confirmada • ${brandName}`;
  const previewText = `✅ ${headerTitle}`;

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
          fontSize: "22px",
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
        Tu cita ha sido confirmada exitosamente con <strong>{brandName}</strong>. Hemos adjuntado el evento a este
        correo para que puedas agregarlo directamente a tu calendario de Google, Outlook o Apple.
      </Text>

      <EmailInfoCard title="Coordenadas de la Reunión" titleColor={branding.accentColor || emailTheme.colors.accentGold}>
        <Text style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          📅 <strong>Fecha:</strong> {dateStr}
        </Text>
        <Text style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          ⏰ <strong>Hora:</strong> {timeStr}
        </Text>
        <Text style={{ margin: "6px 0", color: emailTheme.colors.textPrimary, fontSize: "14px" }}>
          🔗 <strong>Enlace de llamada:</strong>{" "}
          {meetingLink ? (
            <a href={meetingLink} style={{ color: branding.accentColor || emailTheme.colors.accentGold, textDecoration: "underline" }}>
              {meetingLink}
            </a>
          ) : (
            <span style={{ color: emailTheme.colors.textMuted }}>Se generará minutos antes</span>
          )}
        </Text>
      </EmailInfoCard>

      {meetingLink && (
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <EmailButton href={meetingLink} variant="gold" customColor={branding.accentColor || emailTheme.colors.accentGold}>
            Unirse a la Reunión
          </EmailButton>
        </Section>
      )}

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "13px",
          margin: "24px 0 0 0",
        }}
      >
        Atentamente,<br />
        <strong>{`Equipo ${brandName}`}</strong>
      </Text>
    </EmailLayoutShell>
  );
};
