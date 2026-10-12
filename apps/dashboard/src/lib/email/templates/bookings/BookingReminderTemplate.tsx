import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../engine/EmailLayoutShell";
import { EmailButton } from "../../components/EmailButton";
import { EmailInfoCard } from "../../components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../engine/types";
import { emailTheme } from "../../engine/theme";

export interface BookingReminderTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  dateStr: string;
  timeStr: string;
  reminderText: string;
  meetingLink?: string;
  brandName: string;
}

export const BookingReminderTemplate = ({
  branding,
  name,
  dateStr,
  timeStr,
  reminderText,
  meetingLink,
  brandName,
}: BookingReminderTemplateProps) => {
  const isPandoras = branding.isPandorasPlatform !== false;
  const headerTitle = "⏰ Recordatorio de Sesión";
  const previewText = `⏰ Tu sesión con ${brandName} es ${reminderText}`;

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
          fontSize: "15px",
          marginTop: 0,
          lineHeight: "1.6",
        }}
      >
        Hola <strong>{name}</strong>,
      </Text>

      <Text
        style={{
          color: emailTheme.colors.textSecondary,
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {`Te recordamos que tu sesión con `}
        <strong>{brandName}</strong>
        {` comenzará `}
        <strong>{reminderText}</strong>.
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
            <span style={{ color: emailTheme.colors.textMuted }}>Se generará en breve</span>
          )}
        </Text>
      </EmailInfoCard>

      {meetingLink && (
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <EmailButton href={meetingLink} variant="gold" customColor={branding.accentColor || emailTheme.colors.accentGold}>
            Ingresar a la Sesión
          </EmailButton>
        </Section>
      )}
    </EmailLayoutShell>
  );
};
