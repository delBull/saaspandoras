import { Suspense } from 'react';
import { render } from '@react-email/components';
import PandorasCreatorEmail from '@/emails/creator-email';

// Esta página es solo para desarrollo - permite preview del email creator template
export default async function CreatorEmailPreviewPage() {
  // Render the email to HTML
  const html = await render(
    PandorasCreatorEmail({
      email: 'usuario@ejemplo.com',
      name: 'Juan García',
      source: 'landing-start',
    })
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Creator Email Preview
          </h1>
          <p className="text-gray-600">
            Preview del template de email "Creator Email" usado en /start
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📧 Creator Email Template
            </h2>
            <p className="text-sm text-gray-600">
              Asunto: "¡Bienvenido! Empieza la 'Conversación' para lanzar tu Protocolo de Utilidad."
            </p>
          </div>

          <div className="p-0">
            {/* Email preview iframe */}
            <iframe
              srcDoc={html}
              className="w-full h-[800px] border-0 rounded-b-lg"
              title="Email Preview"
            />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Información del Template Creator
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">📧 Asunto</h3>
              <p className="text-sm text-gray-600">"¡Bienvenido! Empieza la 'Conversación' para lanzar tu Protocolo de Utilidad."</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎯 Propósito</h3>
              <p className="text-sm text-gray-600">Convertir suscriptores en aplicantes al formulario conversacional</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">📱 Elementos CTA</h3>
              <p className="text-sm text-gray-600">2 CTAs apuntando a /apply: "¡Empezar a Crear!" y "¡Lanzar Mi Protocolo de Utilidad!"</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎨 Diseño</h3>
              <p className="text-sm text-gray-600">Responsive, tesis profesional, secciones informativas</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="http://localhost:3000/start"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📧 /start Original
          </a>
          <a
            href="http://localhost:3000/preview/emails"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📱 Email Root Preview
          </a>
          <a
            href="http://localhost:3000/preview/emails/highticket"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ♛ High Ticket Email
          </a>
        </div>
      </div>
    </div>
  );
}
