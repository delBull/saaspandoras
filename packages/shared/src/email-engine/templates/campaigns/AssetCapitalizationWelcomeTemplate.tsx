import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailInfoCard } from "../../../email-components/EmailInfoCard";
import type { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface AssetCapitalizationWelcomeTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  assetType?: string;
}

export const AssetCapitalizationWelcomeTemplate = ({
  branding,
  name,
  assetType,
}: AssetCapitalizationWelcomeTemplateProps) => (
  <EmailLayoutShell
    previewText="📐 Asset Capitalization — Solicitud Recibida"
    branding={branding}
    footerProfile="platform"
  >
    <Heading
      as="h2"
      style={{
        margin: "0 0 20px 0",
        color: "#D4AF37",
        fontFamily: "serif",
        fontSize: "24px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textAlign: "center",
      }}
    >
      Asset Capitalization
    </Heading>

    <Text style={{ color: emailTheme.colors.textPrimary, fontSize: "16px", marginTop: 0 }}>
      Estimado/a {name},
    </Text>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      Hemos recibido de manera exitosa su solicitud de contacto a través de nuestro
      Playbook Institucional.
    </Text>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      En Pandoras nos especializamos en transformar patrimonio inmovilizado en capital
      productivo mediante estructuración institucional. Entendemos que cada activo
      requiere una arquitectura jurídica y financiera específica para maximizar su
      potencial de liquidez y crecimiento sin que el propietario pierda el control del
      mismo.
    </Text>

    <Section style={{ marginTop: "24px", marginBottom: "24px" }}>
      <EmailInfoCard title="Estatus de la Solicitud">
        <p style={{ margin: 0, color: emailTheme.colors.textPrimary, fontSize: "15px" }}>
          Tipo de activo: <strong>{assetType || 'no especificado'}</strong>
        </p>
      </EmailInfoCard>
    </Section>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      En breve, uno de nuestros directores de estructuración revisará la información de
      su activo y se pondrá en contacto con usted para agendar una sesión exploratoria
      confidencial.
    </Text>

    <Text style={{ color: emailTheme.colors.textPrimary, fontSize: "15px", marginBottom: 0 }}>
      Atentamente,
      <br />
      <strong>Pandoras Capital Structuring Team</strong>
    </Text>
  </EmailLayoutShell>
);