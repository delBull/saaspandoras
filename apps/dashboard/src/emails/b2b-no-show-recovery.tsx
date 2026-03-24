import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
} from '@react-email/components';

interface B2BNoShowRecoveryEmailProps {
  name: string;
  rescheduleUrl: string;
}

export const B2BNoShowRecoveryEmail = ({
  name = 'Founder',
  rescheduleUrl = 'https://dash.pandoras.finance/schedule/founders',
}: B2BNoShowRecoveryEmailProps) => (
  <Html>
    <Head />
    <Preview>Te extrañamos en nuestra sesión - ¿Todo bien?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.pandoras.finance/logo.png"
          width="150"
          height="auto"
          alt="Pandoras Finance"
          style={logo}
        />
        <Heading style={h1}>Te extrañamos...</Heading>
        <Text style={text}>
          Hola {name},
        </Text>
        <Text style={text}>
          No pudimos coincidir en la sesión agendada para hoy. Entendemos que en el mundo B2B los imprevistos ocurren, por lo que no te preocupes.
        </Text>
        <Text style={text}>
          Sin embargo, no queremos que pierdas el impulso para orquestar tu infraestructura de crecimiento.
        </Text>
        <Section style={highlightSection}>
          <Text style={highlightText}>
            "El éxito no se trata de no caer, sino de levantarse rápido."
          </Text>
        </Section>
        <Section style={buttonContainer}>
          <Link href={rescheduleUrl} style={button}>
            Reprogramar Sesión Ahora
          </Link>
        </Section>
        <Hr style={hr} />
        <Text style={text}>
          Si prefieres que hablemos por otro canal o tienes dudas urgentes, puedes responder directamente a este correo.
        </Text>
        <Text style={footer}>
          Pandoras Finance - Infraestructura para la Nueva Economía
        </Text>
      </Container>
    </Body>
  </Html>
);

export default B2BNoShowRecoveryEmail;

const main = {
  backgroundColor: '#000000',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const logo = {
  display: 'block',
  margin: '0 auto 30px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#cccccc',
  fontSize: '16px',
  lineHeight: '26px',
};

const highlightSection = {
  background: '#111111',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #84cc16',
};

const highlightText = {
  color: '#84cc16',
  fontSize: '18px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#333333',
  margin: '30px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#84cc16',
  borderRadius: '5px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#666666',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '40px',
};
