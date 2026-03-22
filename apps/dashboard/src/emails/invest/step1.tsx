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

interface InvestStep1EmailProps {
  projectName: string;
}

export const InvestStep1Email = ({
  projectName = 'nuestro proyecto'
}: InvestStep1EmailProps) => {
  const previewText = `Tu interés en ${projectName} - Siguientes Pasos`;

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
              Recibimos tu interés en <strong>{projectName}</strong>.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              No estás solo — pero tampoco es acceso abierto. Estamos revisando perfiles antes de abrir completamente el acceso a los próximos cupos.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Mientras tanto, te dejo esto para que nos conozcas a fondo:
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`https://pandoras.finance/projects`} // To be made dynamic later
              >
                Acceso directo a detalles
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Si encaja contigo, lo vas a ver rápido. Si no, también.
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

export default InvestStep1Email;
