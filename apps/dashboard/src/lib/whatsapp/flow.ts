import { formQuestions } from '@/components/conversational-form/formQuestions';
import { getUserState, createUserState, saveAnswer, advanceStep, markCompleted, getCurrentAnswers } from './db';

// Tipos para los mensajes de WhatsApp
interface WhatsAppMessage {
  from: string;
  type: 'text' | 'image' | 'document' | 'sticker' | 'audio' | 'video' | 'location' | 'contacts' | 'unknown';
  text?: {
    body: string;
  };
  image?: any;
  document?: any;
  timestamp: string;
  id: string;
}

interface ProcessingResult {
  nextQuestion?: string;
  isCompleted?: boolean;
  projectCreated?: boolean;
  error?: string;
}

/**
 * Procesar mensaje entrante de WhatsApp
 */
export async function processIncomingMessage(message: WhatsAppMessage): Promise<ProcessingResult> {
  const userPhone = message.from;
  const currentText = message.text?.body?.trim();

  if (!currentText) {
    return { error: 'No se recibió texto en el mensaje' };
  }

  console.log(`📱 Procesando mensaje de ${userPhone}: "${currentText.substring(0, 50)}..."`);

  // Detectar si es usuario iniciando conversación
  if (isInitialTrigger(currentText)) {
    const success = await startNewApplication(userPhone, currentText);
    if (success) {
      const nextQuestion = getQuestionText(0);
      return { nextQuestion };
    }
    return { error: 'Error al iniciar aplicación' };
  }

  // Procesar respuesta normal
  return await processAnswer(userPhone, currentText);
}

/**
 * Detectar si el mensaje es un trigger para iniciar aplicación
 */
function isInitialTrigger(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Triggers más comprehensivos
  const triggers = [
    "inicio",
    "aplicación",
    "protocolo",
    "proyecto",
    "quiero crear",
    "comenzar",
    "creador",
    "hacer mi protocolo",
    "utilidad",
    "pandoras",
    "pandora's"
  ];

  // Verificar si contiene al menos 2 keywords de protocolo
  const hasProtocolKeywords = [
    "protocolo",
    "utilidad",
    "proyecto",
    "crear",
    "pandoras"
  ].some(keyword => lowerText.includes(keyword));

  // O un trigger específico
  const hasSpecificTrigger = triggers.some(trigger =>
    lowerText.includes(trigger)
  );

  return hasProtocolKeywords || hasSpecificTrigger;
}

/**
 * Iniciar nueva aplicación
 */
async function startNewApplication(userPhone: string, initialMessage: string): Promise<boolean> {
  // Extraer nombre si está presente
  const nameMatch = initialMessage.match(/soy\s+([^(]+?)(?:\s*\(|$)/i);
  const applicantName = nameMatch?.[1]?.trim() || null;

  try {
    // Crear estado inicial
    const newState = await createUserState(userPhone);
    if (!newState) {
      console.error('Error creando estado inicial');
      return false;
    }

    // Si pudo extraer nombre, guardarlo
    if (applicantName) {
      await saveAnswer(userPhone, 'applicantName', applicantName);
    }

    console.log(`✅ Nueva aplicación iniciada para ${userPhone}`);
    return true;
  } catch (error) {
    console.error('Error iniciando nueva aplicación:', error);
    return false;
  }
}

/**
 * Procesar respuesta a una pregunta
 */
async function processAnswer(userPhone: string, answer: string): Promise<ProcessingResult> {
  try {
    // Obtener estado actual
    let state = await getUserState(userPhone);
    if (!state) {
      // Usuario intenta responder sin inicializar, empezar conversación
      await startNewApplication(userPhone, answer);
      state = await getUserState(userPhone);
      if (!state) return { error: 'No se pudo inicializar la aplicación' };
    }

    // Asegurarse de que state existe y tiene currentStep
    if (!state || typeof state.currentStep !== 'number') {
      return { error: 'Estado de aplicación inválido' };
    }

    // Obtener la pregunta actual
    const currentQuestion = formQuestions[state.currentStep];
    if (!currentQuestion) {
      return { nextQuestion: 'Parece que hemos terminado. Revisa tu aplicación o contacta soporte.' };
    }

    // TS ahora sabe 100% que currentQuestion no es undefined
    const safeQuestion = currentQuestion as NonNullable<typeof currentQuestion>;
    console.log(`Procesando respuesta para pregunta ${state.currentStep}: ${safeQuestion.label}`);

    // Validar respuesta
    const validationResult = validateAnswer(currentQuestion, answer);
    if (!validationResult.isValid) {
      return {
        nextQuestion: `Respuesta inválida: ${validationResult.error}
Pregunta ${state.currentStep + 1}: ${currentQuestion.label}`
      };
    }

    // Guardar respuesta
    console.log(`Guardando respuesta para ${currentQuestion.id}: ${validationResult.validatedValue}`);
    await saveAnswer(userPhone, currentQuestion.id, validationResult.validatedValue);

    // Avanzar al siguiente paso
    await advanceStep(userPhone);

    // Verificar si terminó
    const updatedState = await getUserState(userPhone);
    if (!updatedState) return { error: 'Error obteniendo estado actualizado' };

    if (updatedState.currentStep >= formQuestions.length) {
      // Completado - crear proyecto
      const result = await createFinalProject(userPhone);
      return {
        isCompleted: true,
        projectCreated: result.success,
        nextQuestion: result.success ?
          '🎉 ¡Aplicación completada! Recibirás 50 tokens por tu primera aplicación.' :
          '❌ Error guardando la aplicación. Por favor intenta nuevamente.'
      };
    }

    // Enviar siguiente pregunta
    const nextQuestionText = getQuestionText(updatedState.currentStep);
    return { nextQuestion: nextQuestionText };

  } catch (error) {
    console.error('Error procesando respuesta:', error);
    return { error: 'Error interno del servidor' };
  }
}

/**
 * Validar respuesta según tipo de pregunta
 */
function validateAnswer(question: any, answer: string): {
  isValid: boolean;
  error?: string;
  validatedValue?: any;
} {
  const text = answer.toLowerCase().trim();

  // Recurring rewards - handle different types
  if (question.id === 'recurringRewards') {
    return { isValid: true, validatedValue: answer };
  }

  // Select inputs
  if (question.component === 'select-input') {
    const selectedIndex = parseInt(text) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= (question.options?.length || 0)) {
      const options = question.options?.map((opt: any, i: number) => `${i + 1}. ${opt.label}`).join(', ') || '';
      return {
        isValid: false,
        error: `Por favor responde con un número del 1 al ${question.options?.length}: ${options}`
      };
    }
    return { isValid: true, validatedValue: question.options[selectedIndex]?.value };
  }

  // Checkbox inputs
  if (question.component === 'checkbox-input') {
    if (text === '1' || text.startsWith('sí') || text.startsWith('si')) {
      return { isValid: true, validatedValue: true };
    }
    if (text === '2' || text.includes('no')) {
      return { isValid: true, validatedValue: false };
    }
    return { isValid: false, error: 'Responde "1" para Sí o "2" para No' };
  }

  // File inputs
  if (question.component === 'file-input') {
    return { isValid: true, validatedValue: answer }; // URL o descripción
  }

  // Number inputs
  if (question.component === 'number-input') {
    const numValue = parseFloat(answer.replace(/[,$%]/g, ''));
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Por favor indica un número válido' };
    }
    return { isValid: true, validatedValue: numValue };
  }

  // URL inputs
  if (question.component === 'url-input') {
    if (!answer.match(/^https?:\/\//)) {
      return { isValid: false, error: 'Por favor indica una URL válida comenzando con http:// o https://' };
    }
    return { isValid: true, validatedValue: answer };
  }

  // Text inputs
  if (!answer.trim()) {
    return { isValid: false, error: 'Respuesta requerida' };
  }

  return { isValid: true, validatedValue: answer };
}

/**
 * Generar texto de pregunta para WhatsApp
 */
function getQuestionText(step: number): string {
  const question = formQuestions[step];
  if (!question) return 'Formulario completado.';

  let questionText = `\nPregunta ${step + 1}:\n${question.label}\n\nRespuesta:`;

  // Formato especial por componente
  if (question.component === 'select-input') {
    const options = (question.options || [])
      .map((opt: any, i: number) => `${i + 1}. ${opt.label}`)
      .join('\n');

    questionText = `Pregunta ${step + 1}:\n${question.label}\n\nEscribe el número de tu opción:\n${options}\n\nRespuesta:`;
  }

  if (question.component === 'checkbox-input') {
    questionText = `Pregunta ${step + 1}:\n${question.label}\n\nEscribe:\n1 = Sí\n2 = No\n\nRespuesta:`;
  }

  if (question.component === 'file-input') {
    questionText = `Pregunta ${step + 1}:\n${question.label}\n\n📁 Envía el archivo (o describe dónde subirlo):\n\nRespuesta:`;
  }

  return questionText;
}

/**
 * Crear proyecto final cuando se complete el formulario
 */
async function createFinalProject(userPhone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener todas las respuestas
    const answers = await getCurrentAnswers(userPhone);
    if (!answers) {
      return { success: false, error: 'No se encontraron respuestas guardadas' };
    }

    // Transformar respuestas al formato esperado por la API
    const transformToProjectData = (answers: any) => {
      const tokenDistribution = {
        publicSale: 100,
        team: 0,
        treasury: 0,
        marketing: 0,
      };

      return {
        ...answers,
        tokenDistribution: JSON.stringify(tokenDistribution),
        status: 'draft',
        featured: false,
        source: 'whatsapp' // Identificar origen
      };
    };

    const projectData = transformToProjectData(answers);

    console.log('🚀 Creando proyecto final desde WhatsApp:', projectData);

    // Crear proyecto usando la API existente
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/projects/utility-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error creando proyecto:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('✅ Proyecto creado desde WhatsApp:', result);

    // Marcar como completado
    await markCompleted(userPhone);

    // TODO: Disparar gamificación aquí
    console.log('🎮 TODO: Disparar evento de gamificación');

    return { success: true };
  } catch (error) {
    console.error('Error creando proyecto final:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
