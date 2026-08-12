/**
 * Pandoras Growth OS — Hermes OS Email Sequences (Production Ready)
 * 
 * Target:
 *  - Sequence A: Unpaid Leads & Subscribers (Conversion & Nurturing)
 *  - Sequence B: Active / Paid Customers (Onboarding & Maximum Leverage)
 * 
 * Environment Base URL: https://dash.pandoras.finance
 */

export interface EmailTemplate {
  id: string;
  triggerDay: number;
  subject: string;
  preheader: string;
  targetAudience: 'UNPAID_LEAD' | 'PAID_CUSTOMER';
  html: (params: { name: string; projectSlug?: string; magicLinkUrl?: string }) => string;
}

const COMMON_HEADER = `
<div style="background-color: #08080C; padding: 30px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E4E4E7;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0C0C12; border: 1px solid rgba(147, 51, 234, 0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Header Logo -->
    <div style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; background: linear-gradient(180deg, rgba(147,51,234,0.1) 0%, rgba(12,12,18,1) 100%);">
      <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF; text-transform: uppercase;">
        PANDORAS <span style="color: #A855F7;">GROWTH OS</span>
      </span>
      <div style="font-size: 11px; font-family: monospace; color: #A1A1AA; margin-top: 4px;">HERMES OS KERNEL v1.0</div>
    </div>
    <!-- Body Content -->
    <div style="padding: 32px 28px; line-height: 1.6; font-size: 14px; color: #D4D4D8;">
`;

const COMMON_FOOTER = `
    </div>
    <!-- Footer -->
    <div style="padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.08); background-color: #08080C; text-align: center; font-size: 11px; color: #71717A;">
      <p style="margin: 0 0 8px 0;">© 2026 Pandoras Growth OS. Infraestructura de Crecimiento Autónomo.</p>
      <p style="margin: 0;">
        <a href="https://dash.pandoras.finance/privacy" style="color: #A855F7; text-decoration: none;">Privacidad</a> | 
        <a href="https://dash.pandoras.finance/terms" style="color: #A855F7; text-decoration: none;">Términos</a> | 
        <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="color: #A855F7; text-decoration: none;">Mi Portal Hermes</a>
      </p>
    </div>
  </div>
</div>
`;

// ============================================================================
// RAMA A: PROSPECTOS & SUSCRIPTORES (NO PAGADOS)
// ============================================================================

export const LEAD_SEQUENCE: EmailTemplate[] = [
  {
    id: 'EMAIL_LEAD_01',
    triggerDay: 0,
    subject: '🤖 Bienvenido a Hermes OS — El Agente que Cambia las Reglas de Crecimiento',
    preheader: 'Descubre cómo automatizar tus ventas y atención con inteligencia autónoma gobernada.',
    targetAudience: 'UNPAID_LEAD',
    html: ({ name, magicLinkUrl }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin-top: 0;">Hola, ${name} 👋</h2>
        <p>Gracias por registrarte para probar <strong>Hermes OS</strong>, el motor de agentes cognitivos de Pandoras Growth OS.</p>
        <p>A diferencia de los chatbots convencionales que repiten respuestas genéricas y alucinan información, Hermes funciona mediante un <strong>Kernel de Gobernanza y Capa de Evidencias Verificadas</strong>.</p>
        
        <div style="background-color: rgba(147,51,234,0.1); border: 1px solid rgba(147,51,234,0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #C084FC; font-size: 14px;">¿Qué puedes lograr con Hermes OS en tu negocio?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #E4E4E7; font-size: 13px;">
            <li><strong>Ahorra +40 horas al mes</strong> en calificación manual de prospectos.</li>
            <li><strong>Respuestas 100% verificadas</strong> usando tu propio Data Room (Cero alucinaciones).</li>
            <li><strong>Omnicanalidad nativa</strong> en Telegram, WhatsApp y Web.</li>
          </ul>
        </div>

        <p style="text-align: center; margin-top: 28px;">
          <a href="${magicLinkUrl || 'https://dash.pandoras.finance/growth-os/hermes/portal/login'}" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 0 15px rgba(147,51,234,0.4);">Acceder a Mi Portal de Prueba →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_LEAD_02',
    triggerDay: 2,
    subject: '🛡️ ¿Por qué los chatbots tradicionales fallan? (El secreto del Evidence Layer)',
    preheader: 'Aprende cómo blindar las respuestas de tu IA con hechos reales de tu empresa.',
    targetAudience: 'UNPAID_LEAD',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">El gran peligro de la IA en ventas, ${name}</h2>
        <p>El mayor miedo de cualquier fundador al usar IA es que el agente le prometa descuentos inexistentes a un cliente o dé información legal incorrecta.</p>
        <p>En Pandoras resolvimos esto creando el <strong>Evidence-Backed Claims Engine</strong> de Hermes OS.</p>
        
        <div style="background-color: #12121A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #A1A1AA;">
            <strong style="color: #34D399;">✓ Cómo funciona:</strong> Solo cuando marcas una afirmación como <em>"Verificado"</em> en tu portal, Hermes la utiliza. Si un usuario pregunta sobre algo no verificado, el agente respeta tus restricciones y escala al operador humano.
          </p>
        </div>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: rgba(255,255,255,0.1); color: #FFFFFF; font-weight: 600; padding: 10px 24px; border-radius: 10px; text-decoration: none; display: inline-block;">Ver la Capa de Evidencias en mi Portal →</a>
        </p>
      ${COMMON_HEADER}
    `
  },
  {
    id: 'EMAIL_LEAD_03',
    triggerDay: 4,
    subject: '📈 Calculadora de ROI: Cuánto puedes ganar y ahorrar con Hermes OS',
    preheader: 'Descubre el impacto económico de automatizar tu embudo comercial.',
    targetAudience: 'UNPAID_LEAD',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Multiplica tu conversión sin aumentar nómina</h2>
        <p>Hola, ${name}. Hagamos un cálculo rápido de eficiencia operativa:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; color: #A1A1AA;">
              <th style="padding: 8px;">Métrica</th>
              <th style="padding: 8px;">Atención Tradicional</th>
              <th style="padding: 8px; color: #C084FC;">Con Hermes OS</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px;">Tiempo de Respuesta</td>
              <td style="padding: 8px; color: #F87171;">2 a 6 horas</td>
              <td style="padding: 8px; color: #34D399;">&lt; 3 segundos (24/7)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px;">Capacidad Simultánea</td>
              <td style="padding: 8px;">1 a 3 chats</td>
              <td style="padding: 8px; color: #34D399;">Ilimitada (Scale-free)</td>
            </tr>
            <tr>
              <td style="padding: 8px;">Costo por Lead Calificado</td>
              <td style="padding: 8px; color: #F87171;">$15 - $30 USD</td>
              <td style="padding: 8px; color: #34D399;">&lt; $1.50 USD</td>
            </tr>
          </tbody>
        </table>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block;">Activar Hermes para Mi Negocio →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_LEAD_04',
    triggerDay: 7,
    subject: '⚡ Conecta Hermes con tu Telegram & WhatsApp en 3 sencillos pasos',
    preheader: 'Manual rápido de integración multicanal con Pandoras Growth OS.',
    targetAudience: 'UNPAID_LEAD',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Donde están tus clientes, está Hermes</h2>
        <p>Hola, ${name}. La mayor ventaja de Hermes es su <strong>Runtime Omnicanal Nativo</strong>. No necesitas código para vincular tus canales.</p>

        <ol style="padding-left: 20px; color: #D4D4D8; font-size: 13px; line-height: 1.8;">
          <li>Obtén tu Token de Telegram desde <strong>@BotFather</strong>.</li>
          <li>Ingresa a tu <strong>Portal Hermes &gt; Pestaña Sett</strong> y pega tu Token.</li>
          <li>Copia tu URL de Webhook y ¡listo! Tu agente comenzará a responder automáticamente.</li>
        </ol>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block;">Probar Integración en Vivo →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_LEAD_05',
    triggerDay: 10,
    subject: '🚀 Tu pase al siguiente nivel de crecimiento autónomo',
    preheader: 'Último llamado para activar tu licencia completa de Pandoras Growth OS.',
    targetAudience: 'UNPAID_LEAD',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">${name}, lleva tu empresa al siguiente nivel</h2>
        <p>Has tenido acceso de prueba al motor de Hermes OS. Es momento de activar todas las capacidades del **Pandoras Growth OS**:</p>

        <ul style="padding-left: 20px; color: #D4D4D8; font-size: 13px; line-height: 1.8;">
          <li>Acceso ilimitado a Hermes Journey Engine (Playbooks de Venta).</li>
          <li>Soporte para tu propia API Key (BYOK con Ollama / Groq / OpenAI).</li>
          <li>Analíticas en tiempo real en la base de datos NeonDB y CRM de Pandoras.</li>
        </ul>

        <p style="text-align: center; margin-top: 28px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 0 20px rgba(147,51,234,0.5);">Activar Mi Cuenta de Producción →</a>
        </p>
      ${COMMON_FOOTER}
    `
  }
];

// ============================================================================
// RAMA B: CLIENTES ACTIVOS / PAGADOS (ONBOARDING & CUSTOMER SUCCESS)
// ============================================================================

export const CLIENT_SEQUENCE: EmailTemplate[] = [
  {
    id: 'EMAIL_PAID_01',
    triggerDay: 0,
    subject: '🎉 ¡Bienvenido a bordo! Tu Tenant de Hermes OS está activo',
    preheader: 'Instrucciones para ingresar a tu Centro de Operaciones Autónomo.',
    targetAudience: 'PAID_CUSTOMER',
    html: ({ name, magicLinkUrl }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin-top: 0;">¡Felicidades, ${name}! 🚀</h2>
        <p>Tu cuenta de <strong>Pandoras Growth OS</strong> y tu Tenant de <strong>Hermes OS</strong> han sido provisionados con éxito en nuestros servidores de producción.</p>
        
        <p>Hemos activado la consola de administración donde podrás gobernar a tu agente, inyectar tu Data Room y monitorear las conversaciones en tiempo real.</p>

        <div style="background-color: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 6px 0; color: #34D399; font-size: 14px;">Tus Credenciales de Acceso:</h4>
          <p style="margin: 0; font-size: 12px; font-family: monospace; color: #E4E4E7;">
            Tenant Activo: <strong>snarai / tu_proyecto</strong><br/>
            Estado: <strong>HEALTHY (v1.0-STABLE)</strong>
          </p>
        </div>

        <p style="text-align: center; margin-top: 28px;">
          <a href="${magicLinkUrl || 'https://dash.pandoras.finance/growth-os/hermes/portal/login'}" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; display: inline-block;">Ingresar a Mi Portal de Operaciones →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_PAID_02',
    triggerDay: 1,
    subject: '🎯 Paso 1: Inyecta tus primeras 5 Evidencias Verificadas',
    preheader: 'Gobernanza inicial para blindar a tu agente comercial.',
    targetAudience: 'PAID_CUSTOMER',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Blindemos a tu agente, ${name}</h2>
        <p>El primer paso crítico es entrenar a Hermes con los hechos verificados de tu empresa.</p>

        <p>Recomendamos agregar al menos <strong>5 Evidence Claims</strong> iniciales:</p>
        <ul style="padding-left: 20px; color: #D4D4D8; font-size: 13px; line-height: 1.8;">
          <li>1 Afirmación General del Producto/Servicio.</li>
          <li>1 Afirmación de Precios / Métodos de Pago.</li>
          <li>1 Afirmación Legal o Garantías.</li>
          <li>2 Respuestas a las Objeciones más frecuentes de tus clientes.</li>
        </ul>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block;">Ir a la Pestaña Know (Evidencias) →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_PAID_03',
    triggerDay: 3,
    subject: '🤖 Paso 2: Eleva la Autonomía a Nivel 3 (Autonomous Agent)',
    preheader: 'Cómo permitir que Hermes califique y cierre conversaciones por ti.',
    targetAudience: 'PAID_CUSTOMER',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Sube de nivel el control operativo</h2>
        <p>Hola, ${name}. En tu Portal Hermes OS puedes ajustar el **Nivel de Autonomía** según la confianza de tu operación:</p>

        <div style="background-color: #12121A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px; line-height: 1.6;">
          <div style="margin-bottom: 8px;"><strong>Level 1 (Human-in-the-loop):</strong> Hermes sugiere respuestas pero requiere tu aprobación antes de enviar.</div>
          <div style="margin-bottom: 8px;"><strong>Level 2 (Co-pilot):</strong> Responde automáticamente y solo escala objeciones no verificadas.</div>
          <div><strong style="color: #C084FC;">Level 3 (Autonomous):</strong> Atención y calificación 100% autónoma 24/7.</div>
        </div>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block;">Ajustar Configuración de Autonomía →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_PAID_04',
    triggerDay: 5,
    subject: '⚡ Conecta tu propia IA con Bring Your Own Key (BYOK)',
    preheader: 'Ejecuta Ollama Cloud, Groq u OpenAI con tus propios modelos.',
    targetAudience: 'PAID_CUSTOMER',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Privacidad y control de modelos total</h2>
        <p>Si tu empresa prefiere utilizar sus propias credenciales de IA o un modelo desplegado de forma privada (ej. Ollama Cloud o Llama 3.1), Hermes OS lo soporta nativamente.</p>

        <p>Solo ve a la pestaña <strong>Sett &gt; Motor IA (BYOK)</strong>, selecciona <em>"Tu Propia IA"</em> e ingresa tu Base URL y API Key.</p>

        <p style="text-align: center; margin-top: 24px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-block;">Configurar Mi Propio LLM →</a>
        </p>
      ${COMMON_FOOTER}
    `
  },
  {
    id: 'EMAIL_PAID_05',
    triggerDay: 8,
    subject: '📊 Analiza tu conversión en el CRM de Pandoras',
    preheader: 'Revisa las métricas de atención, leads calificados y eventos en vivo.',
    targetAudience: 'PAID_CUSTOMER',
    html: ({ name }) => `
      ${COMMON_HEADER}
        <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin-top: 0;">Métricas en tiempo real, ${name}</h2>
        <p>Todas las conversaciones, eventos de agendamiento y leads calificados por Hermes se guardan automáticamente en tu CRM de Pandoras Growth OS.</p>

        <p>Ingresa a tu portal para revisar el <strong>Live Feed & Telemetría</strong> y optimizar el rendimiento de tu embudo.</p>

        <p style="text-align: center; margin-top: 28px;">
          <a href="https://dash.pandoras.finance/growth-os/hermes/portal/login" style="background-color: #9333EA; color: #FFFFFF; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; display: inline-block; box-shadow: 0 0 20px rgba(147,51,234,0.5);">Ver Analíticas en Mi Portal →</a>
        </p>
      ${COMMON_FOOTER}
    `
  }
];
