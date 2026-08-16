import * as React from "react";
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Link, Hr } from "@react-email/components";

interface NexusDealCommentProps {
  recipientName: string;
  authorName: string;
  roomTitle: string;
  commentPreview: string;
  roomUrl: string;
}

export default function NexusDealComment({
  recipientName = "Partner",
  authorName = "Un usuario",
  roomTitle = "Strategic Agreement",
  commentPreview = "...",
  roomUrl = "https://dash.pandoras.finance/nexus",
}: NexusDealCommentProps) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo comentario en: {roomTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nuevo Mensaje en Deal Room</Heading>
          
          <Section style={bodySection}>
            <Text style={greeting}>Hola {recipientName},</Text>
            
            <Text style={text}>
              <strong>{authorName}</strong> ha dejado un nuevo comentario o sugerencia de negociación en la propuesta <strong>{roomTitle}</strong>.
            </Text>
            
            <Section style={commentBox}>
              <Text style={commentText}>"{commentPreview}"</Text>
            </Section>

            <Section style={buttonContainer}>
              <Link href={roomUrl} style={button}>
                Responder en el Deal Room
              </Link>
            </Section>
            
            <Hr style={hr} />
            <Text style={footer}>
              Puedes continuar la negociación directamente en el hilo del documento.
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

const commentBox = {
  backgroundColor: "#f8f9fa",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "4px solid #000",
  margin: "20px 0",
};

const commentText = {
  fontSize: "15px",
  color: "#333",
  fontStyle: "italic",
  margin: 0,
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
