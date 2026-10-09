import { sendEmail } from "../src/lib/email/client";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly for scripts
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUBJECT = "Seguimiento | Hermes Institutional OS — Piloto, prioridades y próximos pasos";

function getHtmlContent(name: string) {
    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d12; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; color: #f4f4f5;">
    <div style="background: #18181b; padding: 28px 24px; text-align: center; border-bottom: 1px solid #27272a;">
        <h2 style="margin: 0; color: #e4c875; font-size: 20px; letter-spacing: -0.02em;">Seguimiento • Hermes Institutional OS</h2>
    </div>
    <div style="padding: 32px 24px;">
        <p style="color: #e4e4e7; font-size: 16px; margin-top: 0;">Hola <strong>${name}</strong>,</p>
        
        <p style="color: #a1a1aa; line-height: 1.6;">
            Gracias por el tiempo y la conversación de hoy. Me pareció especialmente valioso que pudiéramos profundizar no solamente en la visión de Hermes, sino también en los retos reales que enfrentan las organizaciones al incorporar inteligencia artificial en operaciones complejas, especialmente cuando intervienen sistemas heredados, información sensible, dinero, regulación y decisiones de alto impacto.
        </p>
        
        <p style="color: #a1a1aa; line-height: 1.6;">
            Les comparto la presentación para que tengamos una referencia común:<br>
            <strong>Pandora’s — Institutional Agent OS</strong><br>
            <a href="https://dash.pandoras.finance/pitch/institutional-os" style="color: #d4a853; text-decoration: underline;">https://dash.pandoras.finance/pitch/institutional-os</a>
        </p>

        <div style="background: #13141c; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #e4c875;">Dirección que acordamos explorar</h3>
            <p style="margin: 6px 0; color: #f4f4f5; font-size: 14px; line-height: 1.5;">
                La oportunidad que vemos es desarrollar y validar Hermes como una infraestructura institucional para que los agentes de IA puedan operar dentro de organizaciones reales, con identidad, contexto, políticas, gobernanza, validaciones y trazabilidad.
            </p>
            <blockquote style="margin: 12px 0 0 0; padding-left: 12px; border-left: 3px solid #d4a853; color: #d4a853; font-style: italic; font-size: 14px;">
                Hermes propone. La gobernanza autoriza. Las operaciones ejecutan.
            </blockquote>
            <p style="margin: 12px 0 0 0; color: #f4f4f5; font-size: 14px; line-height: 1.5;">
                La intención no es comenzar intentando resolver todos los sectores ni automatizar procesos indiscriminadamente. Queremos identificar un caso de uso concreto, desarrollar un piloto controlado y demostrar tanto su valor comercial como su comportamiento operativo y sus controles de seguridad.
            </p>
        </div>

        <h3 style="color: #e4e4e7; font-size: 16px; margin-top: 32px;">Próximos pasos</h3>
        
        <p style="color: #e4e4e7; font-size: 14px; font-weight: 600; margin-bottom: 4px;">Por mi parte:</p>
        <ul style="color: #a1a1aa; line-height: 1.6; font-size: 14px; margin-top: 0; padding-left: 20px;">
            <li>Preparar una propuesta estructurada del piloto, con alcance, arquitectura, capas de validación, integraciones necesarias y métricas de éxito.</li>
            <li>Definir el enfoque de demostración de Hermes y Nexus, diferenciando las capacidades ya validadas de las que todavía estén en desarrollo.</li>
            <li>Compartir avances semanalmente para mantener visibilidad sobre el progreso y las decisiones pendientes.</li>
        </ul>

        <p style="color: #e4e4e7; font-size: 14px; font-weight: 600; margin-bottom: 4px;">Por su parte:</p>
        <ul style="color: #a1a1aa; line-height: 1.6; font-size: 14px; margin-top: 0; padding-left: 20px;">
            <li>Explorar y priorizar el vertical con mejor potencial inicial, considerando las opciones que discutimos: logística, servicios financieros e inmobiliario.</li>
            <li>Identificar un proceso operativo concreto donde exista un problema relevante, un beneficio medible y una oportunidad real de implementación.</li>
            <li>Compartir las principales restricciones operativas, regulatorias y de integración que debamos considerar desde el diseño.</li>
        </ul>

        <p style="color: #e4e4e7; font-size: 14px; font-weight: 600; margin-bottom: 4px;">En conjunto:</p>
        <ul style="color: #a1a1aa; line-height: 1.6; font-size: 14px; margin-top: 0; padding-left: 20px;">
            <li>Seleccionar el caso de uso prioritario.</li>
            <li>Acordar qué debe demostrar el piloto para considerarse exitoso.</li>
            <li>Evaluar los requisitos de integración, los recursos necesarios, el presupuesto y el calendario.</li>
            <li>Definir los criterios para pasar de una prueba controlada a una posible implementación productiva.</li>
        </ul>

        <h3 style="color: #e4e4e7; font-size: 16px; margin-top: 32px;">Seguimiento</h3>
        <p style="color: #a1a1aa; line-height: 1.6; font-size: 14px;">
            Propongo mantener una reunión semanal de seguimiento, con el jueves entre las 16:00 y las 17:00 como horario tentativo, sujeto a la disponibilidad de todos.
        </p>
        <p style="color: #a1a1aa; line-height: 1.6; font-size: 14px;">
            Para la siguiente sesión, mi objetivo es llegar con una primera propuesta de piloto que nos permita discutir decisiones concretas, en lugar de quedarnos únicamente en la visión general.
        </p>

        <p style="color: #a1a1aa; line-height: 1.6; font-size: 14px; margin-top: 24px;">
            Gracias nuevamente por la apertura y por ayudar a explorar dónde puede generar mayor valor esta infraestructura. Creo que la mejor manera de avanzar es identificar la oportunidad adecuada, validarla con rigor y construir a partir de resultados reales.
        </p>
        <p style="color: #a1a1aa; line-height: 1.6; font-size: 14px;">
            Seguimos en contacto.
        </p>

        <p style="color: #71717a; font-size: 14px; margin-top: 32px; margin-bottom: 0;">
            Saludos,<br>
            <strong>Marco</strong><br>
            Pandora's Institutional OS
        </p>
    </div>
    <div style="background: #111218; padding: 20px; border-top: 1px solid #27272a;">
        <div style="font-size: 12px; color: #71717a; text-align: center;">Pandora's Growth OS • Sovereign Capital & Growth Infrastructure</div>
    </div>
</div>
`;
}

async function main() {
    const recipients = [
        { email: 'eduardo.garza.castillon@gmail.com', name: 'Eduardo' },
        { email: 'pablosegali@gmail.com', name: 'Pablo' }
    ];

    for (const { email, name } of recipients) {
        console.log(`Sending email to ${name} <${email}>...`);
        try {
            await sendEmail({
                to: email,
                subject: SUBJECT,
                html: getHtmlContent(name),
            });
            console.log(`✅ Success for ${name}`);
        } catch (error) {
            console.error(`❌ Failed to send to ${name}:`, error);
        }
    }
    
    console.log("Process complete.");
}

main().catch(console.error);
