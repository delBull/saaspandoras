
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

interface B2BFollowupEmailProps {
    name?: string;
    projectName?: string;
    ctaUrl?: string;
}

export const B2BFollowupEmail = ({
    name = "Founder",
    projectName = "tu proyecto",
    ctaUrl = "https://dash.pandoras.finance/schedule/pandoras",
}: B2BFollowupEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>¿Seguimos adelante con {projectName}?</Preview>
            <Tailwind>
                <Body style={{ ...main, backgroundColor: "#ffffff" }} className="bg-white font-sans px-2">
                    <Container style={container} className="mx-auto py-10 max-w-[580px]">
                        <Section className="mb-8 text-center">
                            <Text className="text-black text-[10px] tracking-[4px] font-bold uppercase">
                                PANDORA'S FINANCE
                            </Text>
                        </Section>

                        <Heading className="text-black text-2xl font-bold text-left mb-6">
                            ¿Hablamos {name}?
                        </Heading>

                        <Text className="text-zinc-700 text-base leading-relaxed mb-6">
                            Te envié un correo hace un par de días sobre <strong>{projectName}</strong> y quería asegurarme de que no se perdió en el ruido.
                        </Text>

                        <Text className="text-zinc-700 text-base leading-relaxed mb-6">
                            En Pandora's trabajamos con un número limitado de protocolos simultáneamente para garantizar que la infraestructura sea sólida y la monetización real.
                        </Text>

                        <Section className="p-6 bg-zinc-50 border border-zinc-200 rounded-lg my-8">
                            <Text className="text-zinc-600 text-sm leading-relaxed mb-6">
                                Si estás listo para desplegar o tienes dudas sobre cómo encajamos en tu roadmap actual, podemos hablar directamente por aquí:
                            </Text>
                            
                            <Button 
                                className="bg-black text-white text-sm font-bold no-underline text-center px-10 py-4 rounded-lg w-full mb-3"
                                href={ctaUrl}
                            >
                                🗓️ Agendar Seguimiento
                            </Button>
                        </Section>

                        <Hr className="border-zinc-200 my-8" />

                        <Text className="text-zinc-700 text-sm leading-relaxed mb-6 italic">
                            "La infraestructura no es un gasto, es el motor que permite que tu utilidad sea real."
                        </Text>

                        <Text className="text-black text-base font-bold mt-8">
                            — Equipo de Estrategia, Pandora’s
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default B2BFollowupEmail;

const main = {
    backgroundColor: "#ffffff",
};

const container = {
    margin: "0 auto",
};
