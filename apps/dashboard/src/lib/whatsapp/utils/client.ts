import { WHATSAPP, validateWhatsAppConfig } from '../config';
import { formatWhatsAppText } from './formatter';

/**
 * Enviar mensaje de texto a través de WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  replyToMessageId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validar parámetros básicos
    if (!to || !text) {
      console.error('❌ Parámetros inválidos para enviar mensaje WhatsApp:', { to: !!to, text: !!text });
      return {
        success: false,
        error: 'Parámetros inválidos: teléfono o mensaje faltante'
      };
    }

    // Validar configuración de WhatsApp
    if (!validateWhatsAppConfig()) {
      console.error('❌ Configuración de WhatsApp inválida');
      return {
        success: false,
        error: 'Configuración de WhatsApp no válida'
      };
    }

    const formattedText = formatWhatsAppText(text);

    const requestBody: any = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: formattedText }
    };

    // Si es respuesta a un mensaje específico
    if (replyToMessageId) {
      requestBody.context = { message_id: replyToMessageId };
      console.log(`📤 Enviando respuesta a mensaje ${replyToMessageId}`);
    }

    console.log(`📤 [WHATSAPP] Enviando mensaje a ${to}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`🔗 [WHATSAPP] URL: ${WHATSAPP.API_URL}/${WHATSAPP.PHONE_NUMBER_ID}/messages`);

    const response = await fetch(
      `${WHATSAPP.API_URL}/${WHATSAPP.PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP.TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log(`📊 [WHATSAPP] Response status: ${response.status} ${response.statusText}`);

    let result: any;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('❌ Error parseando respuesta JSON:', parseError);
      return {
        success: false,
        error: 'Error parseando respuesta de WhatsApp API'
      };
    }

    if (!response.ok) {
      console.error('❌ Error en respuesta de WhatsApp API:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });

      // Mapeo de errores comunes de WhatsApp
      let errorMessage = result.error?.message || 'Error desconocido de WhatsApp API';
      if (result.error?.code) {
        switch (result.error.code) {
          case 100:
            errorMessage = 'Número de teléfono inválido';
            break;
          case 131026:
            errorMessage = 'Mensaje no entregado - número puede estar bloqueado';
            break;
          case 21211:
            errorMessage = 'Formato de número de teléfono inválido';
            break;
          default:
            errorMessage += ` (Código: ${result.error.code})`;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    const messageId = result.messages?.[0]?.id;
    if (!messageId) {
      console.error('❌ Respuesta exitosa pero sin messageId:', result);
      return {
        success: false,
        error: 'Mensaje enviado pero no se recibió confirmación (sin messageId)'
      };
    }

    console.log(`✅ [WHATSAPP] Mensaje enviado exitosamente - ID: ${messageId}`);

    return {
      success: true,
      messageId
    };

  } catch (error) {
    console.error('❌ Error técnico enviando mensaje WhatsApp:', error);

    // Determinar tipo de error
    let errorMessage = 'Error técnico al enviar mensaje';
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Error de conexión - verificar conectividad a internet';
    } else if (error instanceof Error) {
      errorMessage = `Error técnico: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Enviar mensaje interactivo (botones, listas, etc.)
 */
export async function sendInteractiveMessage(
  to: string,
  type: 'button' | 'list',
  options: {
    header?: string;
    body: string;
    footer?: string;
    buttons?: Array<{ type: 'reply'; reply: { id: string; title: string } }>;
    list?: {
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    };
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const interactive = {
      type,
      header: options.header ? { type: 'text', text: options.header } : undefined,
      body: { text: options.body },
      footer: options.footer ? { text: options.footer } : undefined,
      action: type === 'button' ? { buttons: options.buttons } : options.list
    };

    const response = await fetch(
      `${WHATSAPP.API_URL}/${WHATSAPP.PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP.TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error enviando mensaje interactivo:', result);
      return {
        success: false,
        error: result.error?.message || 'Error desconocido'
      };
    }

    return {
      success: true,
      messageId: result.messages?.[0]?.id
    };

  } catch (error) {
    console.error('❌ Error técnico enviando mensaje interactivo:', error);
    return {
      success: false,
      error: 'Error técnico al enviar mensaje interactivo'
    };
  }
}
