import { Suspense } from 'react';
import { render } from '@react-email/components';
import PandorasHighTicketEmail from '@/emails/PandorasHighTicketEmail';

// Esta página es solo para desarrollo - permite preview del email high ticket template
export default async function HighTicketEmailPreviewPage() {
  // Render the email to HTML
  const html = await render(
    PandorasHighTicketEmail({
      name: 'Founder',
      whatsappLink: `https://wa.me/5213117348048?text=${encodeURIComponent("Hola, soy founder y quiero aplicar al programa de Pandora's. Tengo capital disponible.")}`,
      source: 'founders-landing-modal',
    })
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ♛ High Ticket Email Preview
          </h1>
          <p className="text-gray-600">
            Preview del template de email "PandorasHighTicketEmail" usado en /founders
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📧 PandorasHighTicketEmail - Founders Program
            </h2>
            <p className="text-sm text-gray-600">
              Asunto: "Pandora’s Inner Circle — Solo 5 fundadores ingresan cada ciclo"
            </p>
          </div>

          <div className="p-0">
            {/* Email preview iframe */}
            <iframe
              srcDoc={html}
              className="w-full h-[900px] border-0 rounded-b-lg"
              title="Email Preview"
            />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Información del Template High Ticket
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">📧 Asunto</h3>
              <p className="text-sm text-gray-600">"Pandora’s Inner Circle — Solo 5 fundadores ingresan cada ciclo"</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎯 Propósito</h3>
              <p className="text-sm text-gray-600">Convertir leads founders premium en aplicantes directos al programa selectivo</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">📱 Elementos CTA</h3>
              <p className="text-sm text-gray-600">2 CTAs: "Aplicar Ahora" → /apply y "Agendar llamada directa" → WhatsApp</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎨 Diseño</h3>
              <p className="text-sm text-gray-600">Email premium con secciones informativas, evaluación de criterios founders</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🔍 Filtro</h3>
              <p className="text-sm text-gray-600">Incluye sección de evaluación de criterios (capital, comunidad, timeline)</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎯 Conversión</h3>
              <p className="text-sm text-gray-600">Direct-to-apply flow, alta prioridad en pipeline founders</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="http://localhost:3000/preview/emails/creator"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📧 Creator Email Preview
          </a>
          <a
            href="http://localhost:3000/founders"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            🏠 Volver a Founders
          </a>
        </div>
      </div>
    </div>
  );
}
