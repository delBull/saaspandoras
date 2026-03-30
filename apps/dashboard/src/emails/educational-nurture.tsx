
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

interface ProjectEducationalEmailProps {
    name?: string;
    projectName?: string;
    courseUrl?: string;
}

export const ProjectEducationalEmail = ({
    name = "Explorador",
    projectName = "nuestro protocolo",
    courseUrl = "https://dash.pandoras.finance/en/education"
}: ProjectEducationalEmailProps) => {
    
    return (
        <Html>
            <Head />
            <Preview>Tu Masterclass Privada de {projectName} está lista</Preview>
            <Tailwind>
                <Body style={{ ...main, backgroundColor: "#ffffff" }} className="bg-white font-sans px-2">
                    <Container style={container} className="mx-auto py-10 max-w-[580px]">
                        <Section className="mb-8 text-center">
                            <Text className="text-black text-[10px] tracking-[4px] font-bold uppercase">
                                PANDORA'S // EDUCATION ENGINE
                            </Text>
                        </Section>

                        <Heading className="text-black text-2xl font-bold text-left mb-6">
                            Paso siguiente: Tu Masterclass de {projectName}
                        </Heading>

                        <Text className="text-zinc-700 text-base leading-relaxed mb-6">
                            Hola {name},
                        </Text>

                        <Text className="text-zinc-700 text-base leading-relaxed mb-6">
                            He estado siguiendo tu interés en <strong>{projectName}</strong>. 
                            En Pandora's creemos que la mejor inversión es la educación, por lo que hemos generado una **Masterclass Privada** exclusiva para ti.
                        </Text>

                        <Section className="p-8 bg-zinc-50 border border-zinc-200 rounded-[2rem] my-8 shadow-sm">
                            <Heading as="h3" className="text-black text-lg font-bold mb-4 text-center">
                                🎓 Masterclass: El Futuro de {projectName}
                            </Heading>
                            <Text className="text-zinc-600 text-sm leading-relaxed mb-6 text-center">
                                Esta sesión de 15 minutos está diseñada para que entiendas la utilidad real del protocolo, la economía del token y cómo puedes participar en el crecimiento del ecosistema.
                            </Text>
                            
                            <Button 
                                className="bg-black text-white text-sm font-bold no-underline text-center px-10 py-5 rounded-2xl w-full"
                                href={courseUrl}
                            >
                                Acceder a mi Masterclass →
                            </Button>
                        </Section>

                        <Hr className="border-zinc-200 my-8" />

                        <Text className="text-zinc-700 text-sm leading-relaxed mb-6">
                            <strong>¿Por qué recibiste esto?</strong><br />
                            Tu actividad reciente en el ecosistema nos indica que estás listo para profundizar en la infraestructura técnica y económica detrás de {projectName}.
                        </Text>

                        <Text className="text-black text-base font-bold mt-8">
                            — Pandora's AI Architect & Team
                        </Text>

                        <Section className="mt-12 text-center">
                            <Text className="text-zinc-400 text-[10px] italic uppercase tracking-tighter">
                                Este es un activo educativo personalizado de alta fidelidad. 
                                <br />© 2026 Pandora's Finance Protocol.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ProjectEducationalEmail;

const main = {
    backgroundColor: "#ffffff",
};

const container = {
    margin: "0 auto",
};
