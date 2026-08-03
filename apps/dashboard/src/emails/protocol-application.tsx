
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Section,
    Link,
    Hr,
    Img,
} from "@react-email/components";
import * as React from "react";

interface ProtocolApplicationEmailProps {
    name: string;
}

export const ProtocolApplicationEmail = ({
    name = "Futuro Creador",
}: ProtocolApplicationEmailProps) => (
    <Html>
        <Head />
        <Preview>Gracias por aplicar a Pandora’s W2E — paso siguiente</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Img src="https://dash.pandoras.finance/apple-touch-icon.png" width="40" height="40" alt="Pandora's" style={{ borderRadius: '8px', margin: '0 auto 12px', display: 'block' }} />
                    <Text style={logo}>PANDORA'S PLATFORM OS</Text>
                </Section>

                <Heading style={h1}>Paso Siguiente</Heading>

                <Text style={text}>
                    Hola {name},
                </Text>

                <Text style={text}>
                    <strong>Recibimos tu aplicación correctamente.</strong><br />
                    Nuestro equipo revisa solicitudes en menos de 24h para asegurar que tu proyecto encaja con lo que hacemos (infraestructura real, ejecución operativa y monetización a corto plazo).
                </Text>

                <Section style={box}>
                    <Heading as="h3" style={h3}>🔎 ¿Qué sucede ahora?</Heading>
                    <Text style={text}>
                        Revisaremos tu aplicación en breve.
                    </Text>
                    <Text style={text}>
                        <strong>Pandora’s no acepta todos los proyectos.</strong> Si calificas, recibirás una invitación para agendar una llamada estratégica.
                    </Text>
                    <Text style={text}>
                        En esa llamada veremos tu proyecto, tu modelo de monetización y te propondré un paquete claro que puedes contratar para empezar ya mismo.
                    </Text>
                </Section>

                <Hr style={hr} />

                <Text style={text}>
                    <strong>👉 Mientras tanto:</strong><br />
                    Si tienes un pitch deck, breve one-pager o un documento con estadísticas del proyecto, puedes responder a este email con esos archivos adjuntos.<br /><br />

                    Además, te recomendamos leer nuestro <strong>Litepaper Técnico</strong> mientras esperas. Define el marco bajo el cual operan nuestros protocolos de utilidad:<br />
                    <Link href="https://dash.pandoras.finance/litepaper" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "bold" }}>
                        📄 Leer Litepaper Técnico (Web)
                    </Link>
                </Text>

                <Text style={text}>
                    Gracias por tu interés y por pensar en Pandora como infraestructura operativa.
                </Text>

                <Text style={signature}>
                    — Equipo Pandora’s W2E
                </Text>

                <Text style={footer}>
                    (Ten en cuenta que respondemos solo a aplicaciones que califican según nuestros criterios de ejecución.)
                </Text>
            </Container>
        </Body>
    </Html>
);

export default ProtocolApplicationEmail;

const main = {
    backgroundColor: "#000000",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "580px",
};

const header = {
    marginBottom: "30px",
};

const logo = {
    color: "#ffffff",
    fontSize: "12px",
    letterSpacing: "4px",
    fontWeight: "bold",
    textAlign: "center" as const,
};

const h1 = {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "left" as const,
    margin: "0 0 20px",
};

const h3 = {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 10px",
};

const text = {
    color: "#cccccc",
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0 0 20px",
};

const box = {
    padding: "24px",
    backgroundColor: "#111111",
    borderRadius: "8px",
    border: "1px solid #333333",
    margin: "30px 0",
};

const hr = {
    borderColor: "#333333",
    margin: "30px 0",
};

const signature = {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "30px",
};

const footer = {
    color: "#666666",
    fontSize: "12px",
    lineHeight: "20px",
    marginTop: "40px",
    fontStyle: "italic",
};
