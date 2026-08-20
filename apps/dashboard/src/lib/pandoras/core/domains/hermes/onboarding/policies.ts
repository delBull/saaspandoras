import { StageCompletionPolicy } from './types';

export const ONBOARDING_POLICIES: Record<string, StageCompletionPolicy> = {
  BUSINESS_DISCOVERY: {
    stage: 'BUSINESS_DISCOVERY',
    objective: 'Entender a qué se dedica el negocio, qué ofrecen y quiénes son sus clientes.',
    requiredFacts: ['businessName', 'businessType', 'mainOffering', 'targetCustomer'],
    optionalFacts: ['location', 'businessSize', 'differentiators'],
    systemInstruction: `Tu objetivo es recopilar información fundamental sobre el negocio del cliente.
Extrae los siguientes datos requeridos:
- businessName: El nombre del negocio.
- businessType: Tipo de industria o sector (ej. Inmobiliaria, E-commerce, Agencia).
- mainOffering: ¿Qué venden u ofrecen exactamente?
- targetCustomer: ¿A quién se lo venden?

Pregunta de forma conversacional y amable. Si descubres conocimiento, repórtalo en 'discoveredKnowledge'.
Cuando creas que tienes todos los datos requeridos, envía type: "STAGE_READY". De lo contrario, envía "ASK_FOLLOW_UP".`
  },
  IDENTITY_CONFIGURATION: {
    stage: 'IDENTITY_CONFIGURATION',
    objective: 'Definir la identidad, personalidad y tono de voz que Hermes deberá usar al hablar con los clientes.',
    requiredFacts: ['brandTone', 'agentName'],
    optionalFacts: ['languageStyle', 'emojiUsage'],
    systemInstruction: `Tu objetivo es definir la identidad operativa de Hermes.
Extrae los siguientes datos requeridos:
- brandTone: El tono de voz principal (ej. Profesional, Cercano, Directo).
- agentName: El nombre que Hermes debe usar al presentarse (por defecto puede sugerir Hermes, pero preguntar si quieren cambiarlo).

Si descubres conocimiento, repórtalo en 'discoveredKnowledge'.
Cuando tengas todos los datos requeridos, envía type: "STAGE_READY". De lo contrario, envía "ASK_FOLLOW_UP".`
  },
  KNOWLEDGE_GATHERING: {
    stage: 'KNOWLEDGE_GATHERING',
    objective: 'Identificar las fuentes principales de conocimiento o FAQs esenciales.',
    requiredFacts: ['mainKnowledgeSources'],
    optionalFacts: ['frequentQuestions'],
    systemInstruction: `Tu objetivo es identificar de dónde debe sacar información Hermes para responder (FAQs, documentos, links web).
Extrae los siguientes datos requeridos:
- mainKnowledgeSources: Una descripción de las fuentes de datos principales que el cliente planea usar o un resumen de su conocimiento básico.

Si descubres conocimiento, repórtalo en 'discoveredKnowledge'.
Cuando tengas los datos requeridos, envía type: "STAGE_READY". De lo contrario, envía "ASK_FOLLOW_UP".`
  },
  POLICY_DEFINITION: {
    stage: 'POLICY_DEFINITION',
    objective: 'Definir restricciones y límites en las respuestas (políticas de seguridad y operación).',
    requiredFacts: ['coreRestrictions'],
    optionalFacts: ['escalationTriggers'],
    systemInstruction: `Tu objetivo es establecer las reglas que Hermes nunca debe romper.
Extrae los siguientes datos requeridos:
- coreRestrictions: Límites de lo que no puede prometer (ej. no dar garantías, no hacer descuentos sin permiso).

Si descubres conocimiento, repórtalo en 'discoveredKnowledge'.
Cuando tengas los datos requeridos, envía type: "STAGE_READY". De lo contrario, envía "ASK_FOLLOW_UP".`
  },
  CHANNEL_SETUP: {
    stage: 'CHANNEL_SETUP',
    objective: 'Requerir al usuario que configure los canales oficiales (ej. Telegram).',
    requiredFacts: [],
    optionalFacts: [],
    systemInstruction: `En esta fase no puedes recolectar credenciales por seguridad.
Tu único objetivo es informar al usuario que el siguiente paso es conectar sus canales (ej. Telegram) y emitir un CHANNEL_SETUP_REQUIRED.`
  }
};
