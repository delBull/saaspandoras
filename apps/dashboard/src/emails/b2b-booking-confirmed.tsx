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

interface B2BBookingConfirmedEmailProps {
  name: string;
  meetingDate: string;
  meetingTime: string;
}

export const B2BBookingConfirmedEmail = ({
  name = 'Founder',
  meetingDate = 'por confirmar',
  meetingTime = 'por confirmar',
}: B2BBookingConfirmedEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmación de sesión: Todo listo para avanzar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.pandoras.finance/logo.png"
          width="150"
          height="auto"
          alt="Pandoras Finance"
          style={logo}
        />
        <Heading style={h1}>¡Sesión Confirmada!</Heading>
        <Text style={text}>
          Hola {name}, es un gusto saludarte.
        </Text>
        <Text style={text}>
          Tu sesión estratégica ha sido confirmada correctamente. Estamos listos para ayudarte a orquestar tu infraestructura de crecimiento.
        </Text>
        <Section style={detailsSection}>
          <Text style={detailsTitle}>Detalles de la Cita:</Text>
          <Text style={detailsText}>📅 <strong>Fecha:</strong> {meetingDate}</Text>
          <Text style={detailsText}>⏰ <strong>Hora:</strong> {meetingTime}</Text>
          <Text style={detailsText}>📍 <strong>Lugar:</strong> Enlace en la invitación de calendario</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h2}>¿Cómo prepararte?</Heading>
        <Text style={text}>
          Para aprovechar al máximo nuestra sesión, te recomendamos:
        </Text>
        <ul style={list}>
          <li>Tener claros tus objetivos de negocio para este trimestre.</li>
          <li>Revisar nuestro <Link href="https://dash.pandoras.finance/litepaper" style={link}>Litepaper Técnico</Link>.</li>
          <li>Anotar cualquier duda específica sobre protocolos de utilidad.</li>
        </ul>
        <Section style={buttonContainer}>
          <Link href="https://dash.pandoras.finance/education" style={button}>
            Ver Casos de Éxito
          </Link>
        </Section>
        <Text style={footer}>
          Si necesitas reprogramar, por favor hazlo con al menos 24 horas de antelación.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default B2BBookingConfirmedEmail;

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

const h2 = {
  color: '#84cc16',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0',
};

const text = {
  color: '#cccccc',
  fontSize: '16px',
  lineHeight: '26px',
};

const detailsSection = {
  background: '#111111',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const detailsTitle = {
  color: '#84cc16',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '10px',
};

const detailsText = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '5px 0',
};

const list = {
  color: '#cccccc',
  fontSize: '16px',
  paddingLeft: '20px',
};

const hr = {
  borderColor: '#333333',
  margin: '20px 0',
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

const link = {
  color: '#84cc16',
  textDecoration: 'underline',
};

const footer = {
  color: '#666666',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '40px',
};
