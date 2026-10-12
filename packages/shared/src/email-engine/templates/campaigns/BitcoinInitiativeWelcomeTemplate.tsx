import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayoutShell } from "../../EmailLayoutShell";
import { EmailButton } from "../../../email-components/EmailButton";
import type { CanonicalEmailBranding } from "../../types";
import { emailTheme } from "../../theme";

export interface BitcoinInitiativeWelcomeTemplateProps {
  branding: CanonicalEmailBranding;
  name: string;
  briefUrl?: string;
}

export const BitcoinInitiativeWelcomeTemplate = ({
  branding,
  name,
  briefUrl = "https://dash.pandoras.finance/bitcoin-initiative/brief",
}: BitcoinInitiativeWelcomeTemplateProps) => (
  <EmailLayoutShell
    previewText="🏛️ Bienvenido a la Iniciativa Pandoras Bitcoin Real Estate"
    branding={branding}
    footerProfile="platform"
  >
    <Heading
      as="h2"
      style={{
        margin: "0 0 16px 0",
        color: "#F7931A",
        fontSize: "22px",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        textAlign: "center",
      }}
    >
      Iniciativa Pandoras Bitcoin
    </Heading>

    <Text style={{ color: emailTheme.colors.textPrimary, fontSize: "16px", marginTop: 0 }}>
      Hola <strong>{name}</strong>,
    </Text>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      Hemos recibido tu solicitud de contacto para explorar oportunidades de colaboración
      estratégica con tu comunidad.
    </Text>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      En Pandoras estamos construyendo el primer puente institucional entre el capital
      Bitcoin y los activos del mundo real (Real World Assets). Pronto un miembro de
      nuestro equipo se pondrá en contacto contigo para agendar una sesión introductoria.
    </Text>

    <Section style={{ textAlign: "center", marginTop: "28px", marginBottom: "28px" }}>
      <EmailButton href={briefUrl}>Leer el Partnership Brief</EmailButton>
    </Section>

    <Text
      style={{
        color: emailTheme.colors.textSecondary,
        fontSize: "14px",
        lineHeight: "1.6",
      }}
    >
      Mientras tanto, explora a profundidad el brief que detalla nuestra visión, los
      activos génesis y el roadmap de integración de Bitcoin.
    </Text>

    <Text style={{ color: emailTheme.colors.textPrimary, fontSize: "15px", marginBottom: 0 }}>
      Atentamente,
      <br />
      <strong>El Equipo de Pandoras</strong>
    </Text>
  </EmailLayoutShell>
);