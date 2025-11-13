// packages/marketing/src/email/resend.ts
// Resend Email Service - Simple y funcional

interface EmailServiceConfig {
  apiKey: string
  from: string
}

interface EmailData {
  to: string
  subject: string
  html?: string
  text?: string
  template?: string
  data?: Record<string, any>
}

export class EmailService {
  private apiKey: string
  private from: string

  constructor(config: EmailServiceConfig) {
    this.apiKey = config.apiKey
    this.from = config.from
  }

  async send(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        }),
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return { 
          success: false, 
          error: errorData.message || 'Error sending email' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Email templates predefinidos
  async sendWelcomeEmail(to: string, data: { name?: string } = {}): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenido a Pandora's</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">¡Bienvenido a Pandora's!</h1>
            <p>¡Hola${data.name ? ` ${data.name}` : ''}!</p>
            <p>Gracias por suscribirte a nuestro newsletter. Estás a punto de recibir las mejores herramientas para crear comunidades web3.</p>
            <p>En los próximos emails te enviaremos:</p>
            <ul>
              <li>Guías paso a paso para crear protocolos de utilidad</li>
              <li>Casos de éxito de creadores que ya están usando Pandora's</li>
              <li>Actualizaciones sobre nuevas funcionalidades</li>
            </ul>
            <p>¡Es un placer tenerte en nuestra comunidad!</p>
            <p><strong>El equipo de Pandora's</strong></p>
          </div>
        </body>
      </html>
    `

    return this.send({
      to,
      subject: '¡Bienvenido a la comunidad de creadores! 🚀',
      html
    })
  }

  async sendNewsletter(to: string, data: { 
    title: string
    content: string
    cta?: { text: string; url: string }
  }): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">${data.title}</h1>
            <div style="margin: 20px 0;">${data.content}</div>
            ${data.cta ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.cta.url}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  ${data.cta.text}
                </a>
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Para dejar de recibir estos emails, haz clic en "Cancelar suscripción" al final de este mensaje.
            </p>
          </div>
        </body>
      </html>
    `

    return this.send({
      to,
      subject: data.title,
      html
    })
  }
}

// Helper functions para formularios
export async function handleEmailSignup(
  email: string, 
  options: {
    service?: EmailService
    welcomeEmail?: boolean
    onSuccess?: () => void
    onError?: (error: string) => void
  } = {}
): Promise<boolean> {
  try {
    // Aquí puedes agregar la lógica para guardar en tu base de datos
    // Por ejemplo, podrías enviar el email a una API que guarde en Supabase, 
    // Mailchimp, ConvertKit, etc.

    // Simular guardado en base de datos
    console.log('New subscriber:', email)
    
    // Enviar welcome email si está configurado
    if (options.welcomeEmail && options.service) {
      await options.service.sendWelcomeEmail(email)
    }

    options.onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    options.onError?.(errorMessage)
    return false
  }
}

// Configuración por defecto para desarrollo
export const defaultEmailService = new EmailService({
  apiKey: process.env.RESEND_API_KEY || '',
  from: process.env.RESEND_FROM || 'noreply@pandoras.finance'
})