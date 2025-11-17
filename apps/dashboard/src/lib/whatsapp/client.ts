import { WHATSAPP } from './config';

/**
 * Enviar mensaje de texto a través de WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  replyToMessageId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const requestBody: any = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    };

    // Si es respuesta a un mensaje específico
    if (replyToMessageId) {
      requestBody.context = { message_id: replyToMessageId };
    }

    console.log(`📤 Enviando mensaje a ${to}: ${text.substring(0, 50)}...`);

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

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error enviando mensaje WhatsApp:', result);
      return {
        success: false,
        error: result.error?.message || 'Error desconocido'
      };
    }

    console.log('✅ Mensaje enviado exitosamente:', result.messages?.[0]?.id);

    return {
      success: true,
      messageId: result.messages?.[0]?.id
    };

  } catch (error) {
    console.error('❌ Error técnico enviando mensaje WhatsApp:', error);
    return {
      success: false,
      error: 'Error técnico al enviar mensaje'
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
