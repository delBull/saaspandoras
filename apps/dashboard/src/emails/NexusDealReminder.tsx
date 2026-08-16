import * as React from "react";
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Link, Hr } from "@react-email/components";

interface NexusDealReminderProps {
  signerName: string;
  roomTitle: string;
  roomUrl: string;
}

export default function NexusDealReminder({
  signerName = "Partner",
  roomTitle = "Strategic Agreement",
  roomUrl = "https://dash.pandoras.finance/nexus",
}: NexusDealReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Recordatorio: Propuesta pendiente de firma - {roomTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nexus Deal Room</Heading>
          
          <Section style={bodySection}>
            <Text style={greeting}>Hola {signerName},</Text>
            
            <Text style={text}>
              Te escribimos para recordarte que la propuesta <strong>{roomTitle}</strong> sigue pendiente de revisión y firma en el Deal Room.
            </Text>
            
            <Text style={text}>
              Si tienes alguna duda o deseas proponer ajustes, puedes utilizar la nueva función de comentarios directamente en el documento.
            </Text>

            <Section style={buttonContainer}>
              <Link href={roomUrl} style={button}>
                Abrir Propuesta
              </Link>
            </Section>
            
            <Hr style={hr} />
            <Text style={footer}>
              Este es un correo automático generado por el motor operativo de Pandora's.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const bodySection = {
  padding: "20px",
};

const greeting = {
  fontSize: "18px",
  lineHeight: "28px",
  color: "#333",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#555",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "30px",
  marginBottom: "30px",
};

const button = {
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "5px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
