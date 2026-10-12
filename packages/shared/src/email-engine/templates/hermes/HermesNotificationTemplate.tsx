import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailButton } from "../../../email-components/EmailButton";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface HermesNotificationTemplateProps {
  branding: CanonicalEmailBranding;
  title: string;
  recipientName: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  badge?: string;
  type?: "info" | "warning" | "success" | "danger";
}

export const HermesNotificationTemplate = ({
  branding,
  title,
  recipientName,
  message,
  ctaText,
  ctaUrl,
  badge,
  type = "info",
}: HermesNotificationTemplateProps) => {
  let accentColor: string = emailTheme.colors.accentDefault;
  if (type === "warning") accentColor = emailTheme.colors.accentGold;
  if (type === "danger") accentColor = emailTheme.colors.accentDanger;
  if (type === "success") accentColor = emailTheme.colors.accentEmerald;

  return (
    <EmailLayoutShell
      previewText={title}
      branding={branding}
      footerProfile="platform"
    >
      {badge && (
        <Section style={{ textAlign: "center", marginBottom: "8px" }}>
          <Text
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${accentColor}`,
              color: accentColor,
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: 0,
            }}
          >
            {badge}
          </Text>
        </Section>
      )}

      <Heading
        as="h2"
        style={{
          margin: "0 0 16px 0",
          color: emailTheme.colors.textPrimary,
          fontSize: "20px",
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
          fontSize: "15px",
          lineHeight: "1.6",
          marginTop: 0,
        }}
      >
        Hola <strong>{recipientName}</strong>,
      </Text>

      <EmailInfoCard title="Detalles del Sistema" titleColor={accentColor}>
        <Text
          style={{
            margin: 0,
            color: emailTheme.colors.textSecondary,
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          {message}
        </Text>
      </EmailInfoCard>

      {ctaUrl && ctaText && (
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <EmailButton href={ctaUrl} customColor={accentColor}>
            {ctaText}
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
        Esta es una notificación generada automáticamente por el plano operacional de Hermes AI.
      </Text>
    </EmailLayoutShell>
  );
};
