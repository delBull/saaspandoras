import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

interface WelcomeActiveClientEmailProps {
    name: string;
    projectName: string;
    dashboardLink: string;
}

export const WelcomeActiveClientEmail = ({
    name = 'Founder',
    projectName = 'Tu Proyecto',
    dashboardLink = 'https://dash.pandoras.finance',
}: WelcomeActiveClientEmailProps) => (
    <Html>
        <Head />
        <Preview>Bienvenido a Pandora's Finance: Tu lugar está asegurado.</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={logo}>
                    <Text style={logoText}>PANDORA'S</Text>
                </Section>
                <Heading style={h1}>¡Bienvenido, {name}!</Heading>
                <Text style={text}>
                    Hemos confirmado tu pago y tu fase de análisis ha comenzado oficialmente.
                </Text>
                <Text style={text}>
                    Tu proyecto <strong>{projectName}</strong> ha sido marcado como "Cliente Activo" en nuestro sistema.
                    Nuestro equipo técnico ya ha recibido la notificación y comenzará la revisión de tu arquitectura.
                </Text>

                <Section style={box}>
                    <Text style={boxTitle}>Siguientes Pasos (24-48h):</Text>
                    <Text style={boxText}>
                        1. Asignación de un Arquitecto de Soluciones.<br />
                        2. Creación de tu canal privado de comunicación.<br />
                        3. Envío del SOW (Scope of Work) preliminar.
                    </Text>
                </Section>

                <Section style={btnContainer}>
                    <Link style={button} href={dashboardLink}>
                        Ir a mi Dashboard
                    </Link>
                </Section>

                <Hr style={hr} />

                <Text style={footer}>
                    Si tienes dudas urgentes, responde a este correo.
                    <br />
                    Pandora's Finance Inc.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default WelcomeActiveClientEmail;

const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const logo = {
    padding: '20px 0',
};

const logoText = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '4px',
};

const h1 = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '16px 0',
};

const text = {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
};

const box = {
    padding: '24px',
    backgroundColor: '#18181b', // zinc-900
    borderRadius: '12px',
    margin: '24px 0',
    border: '1px solid #27272a', // zinc-800
};

const boxTitle = {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
};

const boxText = {
    color: '#d4d4d8', // zinc-300
    fontSize: '14px',
    lineHeight: '24px',
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
};

const button = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const hr = {
    borderColor: '#333',
    margin: '20px 0',
};

const footer = {
    color: '#666',
    fontSize: '12px',
    lineHeight: '24px',
};
