import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface PandorasCampaignEmailProps {
    previewText: string;
    heading: string;
    bodyContent: React.ReactNode;
    ctaText?: string;
    ctaLink?: string;
}

export const PandorasCampaignEmail = ({
    previewText,
    heading,
    bodyContent,
    ctaText,
    ctaLink,
}: PandorasCampaignEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-black text-white font-sans antialiased">
                    <Container className="mx-auto my-10 max-w-[500px] p-5 border border-zinc-800 rounded-lg bg-zinc-950">
                        <Section className="mt-4 mb-6">
                            <Text className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent m-0">
                                Pandora's
                            </Text>
                        </Section>

                        <Heading className="text-xl font-bold text-white mb-4">
                            {heading}
                        </Heading>

                        <Section className="text-zinc-300 text-base leading-relaxed mb-6 whitespace-pre-line">
                            {bodyContent}
                        </Section>

                        {ctaLink && (
                            <Section className="mb-6">
                                <Link
                                    href={ctaLink}
                                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md text-sm no-underline block text-center w-full"
                                >
                                    {ctaText || "Ver más"}
                                </Link>
                            </Section>
                        )}

                        <Section className="border-t border-zinc-800 pt-6 mt-8">
                            <Text className="text-xs text-zinc-500 m-0">
                                Pandoras Finance — Infraestructura W2E.<br />
                                No respondas a este correo.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default PandorasCampaignEmail;
