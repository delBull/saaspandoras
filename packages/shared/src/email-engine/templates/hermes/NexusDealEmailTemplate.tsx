import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailButton } from "../../../email-components/EmailButton";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface NexusDealEmailTemplateProps {
  branding: CanonicalEmailBranding;
  dealKindLabel: string;
  counterparty: string;
  recipientName?: string;
  type: "invitation" | "comment" | "reminder" | "confirmation" | "cancellation";
  commentPreview?: string;
  actionUrl: string;
  actionText?: string;
  summaryItems?: { label: string; value: string }[];
  noticeText?: string;
}

export const NexusDealEmailTemplate = ({
  branding,
  dealKindLabel,
  counterparty,
  recipientName,
  type,
  commentPreview,
  actionUrl,
  actionText = "Revisar y Continuar →",
  summaryItems,
  noticeText,
}: NexusDealEmailTemplateProps) => {
  let title = `${dealKindLabel} · ${counterparty}`;
  let badgeText = "Pandoras Nexus · Transaction Room";
  let accentColor = branding.accentColor || emailTheme.colors.accentGold;

  if (type === "comment") {
    badgeText = "Nexus Deal Room · Nuevo Mensaje";
    title = `Mensaje en ${dealKindLabel}`;
  } else if (type === "reminder") {
    badgeText = "Nexus Deal Room · Recordatorio";
    title = `Revisión Pendiente · ${counterparty}`;
  } else if (type === "confirmation") {
    badgeText = "Nexus Deal Room · Notarización";
    title = `Acuerdo Notarizado · ${counterparty}`;
    accentColor = emailTheme.colors.accentEmerald;
  } else if (type === "cancellation") {
    badgeText = "Nexus Deal Room · Estado";
    title = `Operación Cancelada · ${counterparty}`;
    accentColor = emailTheme.colors.accentDanger;
  }

  return (
    <EmailLayoutShell
      previewText={`${dealKindLabel} — ${counterparty}`}
      branding={branding}
      footerProfile="platform"
    >
      <Section style={{ textAlign: "center", marginBottom: "12px" }}>
        <Text
          style={{
            display: "inline-block",
            padding: "5px 14px",
            borderRadius: "9999px",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${accentColor}`,
            color: accentColor,
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: 0,
          }}
        >
          {badgeText}
        </Text>
      </Section>

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

      {recipientName && (
        <Text
          style={{
            color: emailTheme.colors.textPrimary,
            fontSize: "15px",
            lineHeight: "1.6",
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Hola <strong>{recipientName}</strong>,
        </Text>
      )}

      {commentPreview && (
        <EmailInfoCard title="Mensaje" titleColor={accentColor}>
          <Text
            style={{
              margin: 0,
              color: emailTheme.colors.textSecondary,
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            }}
          >
            {commentPreview}
          </Text>
        </EmailInfoCard>
      )}

      {summaryItems && summaryItems.length > 0 && (
        <EmailInfoCard title="Detalles de la Operación" titleColor={accentColor}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {summaryItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: idx < summaryItems.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <td style={{ padding: "8px 0", color: emailTheme.colors.textMuted, fontSize: "13px" }}>{item.label}</td>
                  <td style={{ padding: "8px 0", color: emailTheme.colors.textPrimary, fontSize: "13px", textAlign: "right", fontWeight: 600 }}>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </EmailInfoCard>
      )}

      {noticeText && (
        <Text
          style={{
            color: emailTheme.colors.textSecondary,
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "16px 0",
          }}
        >
          {noticeText}
        </Text>
      )}

      <Section style={{ textAlign: "center", margin: "28px 0" }}>
        <EmailButton href={actionUrl} customColor={accentColor}>
          {actionText}
        </EmailButton>
      </Section>

      <Text
        style={{
          color: emailTheme.colors.textMuted,
          fontSize: "11px",
          textAlign: "center",
          margin: "24px 0 0 0",
          lineHeight: "1.5",
        }}
      >
        Este enlace institucional es confidencial. Si tienes preguntas técnicas o legales, contacta al equipo de coordinación en el Nexus Deal Room.
      </Text>
    </EmailLayoutShell>
  );
};
