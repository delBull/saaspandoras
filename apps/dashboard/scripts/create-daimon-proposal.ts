import { db } from '@/db';
import { nexusDealRooms, nexusDealSigners, nexusDealSections } from '@/db/schema';
import { randomUUID } from 'crypto';

async function main() {
  const roomId = randomUUID();

  console.log(`Creando Daimon Proposal con ID: ${roomId}`);

  await db.insert(nexusDealRooms).values({
    id: roomId,
    publicId: 'PDR-DAIMON1',
    title: 'Proyecto Daimon - Technical Discovery & Architecture Proposal',
    kind: 'PROPOSAL',
    counterparty: 'Daimon',
    relation: 'Client',
    company: 'Daimon MVP',
    status: 'DRAFT',
    summary: 'Propuesta Técnica, Arquitectura de Infraestructura y Términos Comerciales para Daimon MVP',
    autoShare: true,
    openSign: true,
    ndaEnabled: true,
    ndaPhase: 'before_proposal'
  });

  await db.insert(nexusDealSigners).values([
    {
      roomId: roomId,
      email: 'marco.munoz9@gmail.com',
      status: 'PENDING'
    }
  ]);

  await db.insert(nexusDealSections).values([
    { 
      roomId: roomId, 
      code: '01', 
      title: '1. Resumen Ejecutivo',
      content: 'Tras la revisión exhaustiva de los requerimientos de Daimon (D1, D2, D3), confirmamos la viabilidad técnica para construir una infraestructura de Inteligencia Artificial que preserve estrictamente la **agencia humana**, enfocándose en la indagación, la metacognición y la memoria longitudinal, distanciándose por diseño de los chatbots resolutivos convencionales.'
    },
    { 
      roomId: roomId, 
      code: '02', 
      title: '2. Arquitectura Base y Aislamiento',
      content: 'Para garantizar el cumplimiento de las normativas de privacidad clínica/terapéutica y aislar el núcleo cognitivo de Daimon, proponemos un despliegue de **Infraestructura Dedicada (Dedicated Tenant / White-Label)**.\n\n- **Autenticación y Control Plane:** Utilizaremos un sistema de Control de Accesos Basado en Roles (RBAC) estricto. Cada profesional tendrá un entorno criptográficamente aislado donde los procesos (pacientes/coachees) no colisionan.\n- **Trazabilidad Epistemológica (Sovereign Vault):** Todo registro original de sesión se almacena inmutablemente. La separación entre el *hecho registrado*, la *interpretación de Daimon* y la *hipótesis* quedará garantizada a nivel base de datos utilizando arquitecturas de almacenamiento en bóvedas soberanas.'
    },
    { 
      roomId: roomId, 
      code: '03', 
      title: '3. El Core de Daimon (Desarrollo Diferencial)',
      content: '- **Memoria Relacional y Evolutiva (Fases 3 y 4):** Desplegaremos un motor de embeddings y bases de datos vectoriales capaz de re-evaluar la relevancia de memorias antiguas con base en nuevos inputs, permitiendo el "análisis longitudinal" sin alucinaciones.\n- **Orquestación Multi-Agente (Fase 4 y 5):** Daimon actuará como el orquestador principal. Cuando la indagación requiera contraste, el motor enrutará la petición a sub-agentes (ej. perspectivas clínicas específicas) y presentará una síntesis abierta que *devuelve* la decisión al profesional.\n- **Behavioral AI Suite (Fase 6):** Implementaremos *LLM-as-a-judge pipelines* para garantizar que el modelo respeta los "Límites de Rol". La IA se configurará mediante prompts de sistema dinámicos que fuerzan la preservación de la incertidumbre.'
    },
    { 
      roomId: roomId, 
      code: '04', 
      title: '4. Siguientes Pasos (Technical Discovery)',
      content: 'Avanzaremos a la Fase 1 (Fundaciones) con un esquema ágil de desarrollo end-to-end, asegurando que el primer *Vertical Slice* permita interactuar con el motor de memoria antes de escalar a capacidades multi-agente complejas.'
    },
    {
      roomId: roomId,
      code: '05',
      title: '5. Términos, Condiciones y Disclaimers Legales',
      content: 'Al interactuar con esta propuesta tecnológica, ambas partes (Daimon y Pandora\'s / MXHUB S.A.P.I de C.V.) se someten a los siguientes lineamientos profesionales:\n\n- **1. Confidencialidad Asegurada (NDA):** Toda la información técnica y de negocio compartida en este documento está salvaguardada por el NDA firmado criptográficamente previo al acceso de esta sala.\n- **2. Validez de la Oferta:** Los tiempos, arquitecturas y posibles cotizaciones derivadas de esta propuesta tienen una validez de **30 días naturales** a partir de su publicación on-chain.\n- **3. Propiedad Intelectual (IP):** Pandora\'s (MXHUB S.A.P.I de C.V.) retiene la propiedad intelectual del código fundacional, *Control Plane*, *Omnichannel Gateway* y *Sovereign Vault*. Daimon retendrá el 100% del IP sobre los datos de los usuarios, prompts especializados, *Behavioral AI Suites* y la lógica de negocio terapéutica desplegada sobre la infraestructura.\n- **4. Exclusiones (Out-of-Scope):** Esta propuesta inicial de arquitectura excluye los costos operativos derivados del uso de APIs de terceros (ej. OpenAI, Anthropic) y los costos elásticos de servidores en producción (Vercel/Neon), los cuales serán facturados en un modelo *pass-through* o gestionados directamente por Daimon.\n- **5. SLA y Responsabilidad:** Pandora\'s proporcionará el mantenimiento de la infraestructura base, pero el comportamiento clínico y responsabilidad terapéutica recae única y exclusivamente sobre los parámetros operativos configurados por Daimon.'
    }
  ]);

  console.log("Proposal creada exitosamente con Términos Legales.");
  process.exit(0);
}

main().catch(console.error);
