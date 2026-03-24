
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
    Button,
    Tailwind
} from "@react-email/components";
import * as React from "react";

interface B2BWelcomeEmailProps {
    name?: string;
    projectName?: string;
    ctaText?: string;
    ctaUrl?: string;
    whatsappUrl?: string;
    source?: string;
}

export const B2BWelcomeEmail = ({
    name = "Founder",
    projectName = "tu proyecto",
    ctaText = "Agendar Llamada Estratégica",
    ctaUrl = "https://calendly.com/pandoras-finance/strategy",
    whatsappUrl = "https://wa.me/5213221374392",
    source = "growth-os"
}: B2BWelcomeEmailProps) => {
    
    // Customize content based on source/intent
    const isAudit = source.includes('growth-os');
    const title = isAudit ? "Tu Auditoría de Infraestructura" : "Siguientes Pasos: Lanzamiento";
    
    return (
        <Html>
            <Head />
            <Preview>{title} — Pandora’s Foundation</Preview>
            <Tailwind>
                <Body style={main} className="bg-black font-sans px-2">
                    <Container style={container} className="mx-auto py-10 max-w-[580px]">
                        <Section className="mb-8 text-center">
                            <Text className="text-white text-[10px] tracking-[4px] font-bold uppercase">
                                PANDORA'S FINANCE
                            </Text>
                        </Section>

                        <Heading className="text-white text-2xl font-bold text-left mb-6">
                            {title}
                        </Heading>

                        <Text className="text-[#cccccc] text-base leading-relaxed mb-6">
                            Hola {name},
                        </Text>

                        <Text className="text-[#cccccc] text-base leading-relaxed mb-6">
                            <strong>Recibimos tu solicitud para {projectName} correctamente.</strong><br />
                            En Pandora's no solo construimos código; desplegamos infraestructuras operativas que generan flujo de caja real. 
                        </Text>

                        <Section className="p-6 bg-[#111111] border border-[#333333] rounded-lg my-8">
                            <Heading as="h3" className="text-white text-lg font-bold mb-4">
                                🔎 ¿Qué sucede ahora?
                            </Heading>
                            <Text className="text-[#cccccc] text-sm leading-relaxed mb-4">
                                {isAudit 
                                    ? "Nuestro equipo técnico está analizando tu ecosistema para identificar cuellos de botella en tu monetización y retención."
                                    : "Estamos revisando tu modelo de negocio para asegurar que el motor de Pandora's pueda escalar tu visión con la velocidad necesaria."
                                }
                            </Text>
                            <Text className="text-[#cccccc] text-sm leading-relaxed mb-6 font-bold">
                                El siguiente paso es una sesión 1-a-1 para presentarte el roadmap de ejecución:
                            </Text>
                            
                            <Button 
                                className="bg-white text-black text-sm font-bold no-underline text-center px-10 py-4 rounded-lg w-full mb-3"
                                href={ctaUrl}
                            >
                                {ctaText}
                            </Button>
                        </Section>

                        <Hr className="border-[#333333] my-8" />

                        <Text className="text-[#cccccc] text-sm leading-relaxed mb-6">
                            <strong>Mientras tanto:</strong><br />
                            Te recomiendo revisar nuestro <strong>Master Monetization Plan</strong> para entender cómo transformamos interacción en activos financieros:<br />
                            <Link href="https://dash.pandoras.finance/growth-os" className="text-[#3b82f6] no-underline font-bold mt-2 inline-block">
                                🔗 Ver Ecosistema de Monetización
                            </Link>
                        </Text>

                        <Text className="text-white text-base font-bold mt-8">
                            — Equipo de Estrategia, Pandora’s
                        </Text>

                        <Text className="text-[#666666] text-[10px] mt-10 italic text-center uppercase tracking-tighter">
                            Infraestructura para Proyectos con Visión de Ejecución.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default B2BWelcomeEmail;

const main = {
    backgroundColor: "#000000",
};

const container = {
    margin: "0 auto",
};
