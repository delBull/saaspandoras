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
  Button
} from '@react-email/components';
import React from 'react';

interface ExploreStep1EmailProps {
  projectName: string;
  differentiator?: string;
  projectSlug?: string;
  baseUrl?: string;
  ctaUrl?: string;
}

export const ExploreStep1Email = ({
  projectName = 'nuestro proyecto',
  differentiator = 'una tecnología diferencial',
  projectSlug = '',
  baseUrl = 'https://dash.pandoras.finance',
  ctaUrl
}: ExploreStep1EmailProps) => {
  const previewText = `Viste algo en ${projectName} que te llamó la atención...`;
  
  // Dynamic link to the project or educational draft
  const finalCtaUrl = ctaUrl || `${baseUrl}/education/courses/draft-${projectSlug}`;
  const isAcquisition = !!ctaUrl;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              <strong>{projectName}</strong>
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hola,
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Viste algo en <strong>{projectName}</strong> que te llamó la atención… y hiciste bien en entrar.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              La mayoría de la gente se queda viendo desde fuera. Tú ya diste el primer paso.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Pero hay un problema:
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              👉 El 90% de los proyectos se ven bien… hasta que intentas entenderlos.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Por eso hicimos algo distinto. Te dejamos aquí un acceso rápido para entender exactamente qué es {projectName} y cómo usamos {differentiator} en menos de 5 minutos:
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded-lg text-white text-[14px] font-bold no-underline text-center px-10 py-4 inline-block"
                href={finalCtaUrl}
              >
                {isAcquisition ? 'Adquirir ahora' : 'Explorar ahora'}
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Si después de eso no te hace sentido, puedes ignorarlo sin problema.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Pero si sí… vas a entender antes que el resto.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              — Equipo {projectName}
            </Text>
            
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ExploreStep1Email;
