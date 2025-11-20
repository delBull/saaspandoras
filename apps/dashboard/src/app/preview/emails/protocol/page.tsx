import { Suspense } from 'react';
import { render } from '@react-email/components';
import PandorasProtocolFilterEmail from '@/emails/PandorasProtocolFilterEmail';

// Esta página es solo para desarrollo - permite preview del email protocol filter template
export default async function ProtocolFilterEmailPreviewPage() {
  // Render the email to HTML
  const html = await render(
    PandorasProtocolFilterEmail({
      name: 'Creador',
      whatsappLink: `https://wa.me/5213221374392?text=${encodeURIComponent('Estoy interesado en crear un utility protocol funcional')}`,
      applyLink: 'https://dash.pandoras.finance/apply'
    })
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Protocol Filter Email Preview
          </h1>
          <p className="text-gray-600">
            Preview del template de email "PandorasProtocolFilterEmail" usado en /utility-protocol
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📧 PandorasProtocolFilterEmail - Utility Protocol Filtro
            </h2>
            <p className="text-sm text-gray-600">
              Asunto: "Análisis de Viabilidad Funcional - Protocolo de Utilidad"
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
            📊 Información del Template Protocol Filter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">📧 Asunto</h3>
              <p className="text-sm text-gray-600">"Análisis de Viabilidad Funcional - Protocolo de Utilidad"</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎯 Propósito</h3>
              <p className="text-sm text-gray-600">Informar sobre resultados del filtro de 8 preguntas y guiar siguiente pasos</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">📱 Elementos CTA</h3>
              <p className="text-sm text-gray-600">1 CTA: "Hablar por WhatsApp" → Continuar con evaluación técnica</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎨 Diseño</h3>
              <p className="text-sm text-gray-600">Email profesional con focus en proceso técnico y próximos pasos</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🔍 Filtro Info</h3>
              <p className="text-sm text-gray-600">Resultados del filtro 8Q, explicación de siguiente etapa (Fuzz Testing + Arquitectura)</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">🎯 Conversión</h3>
              <p className="text-sm text-gray-600">Activación automática del flujo Eight Q via WhatsApp CTA específico</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="http://localhost:3000/preview/emails/highticket"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ♛ High Ticket Email Preview
          </a>
          <a
            href="http://localhost:3000/preview/emails/creator"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📧 Creator Email Preview
          </a>
          <a
            href="http://localhost:3000/utility-protocol"
            className="text-center inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🏗️ Utility Protocol
          </a>
        </div>
      </div>
    </div>
  );
}
