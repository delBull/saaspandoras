'use client';

import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function BitcoinPartnershipBrief() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#E5E5E5] min-h-screen font-sans text-gray-900 selection:bg-[#F7931A]/30 pb-24 print:bg-white print:pb-0 print:p-0">
      
      {/* Web Controls (Hidden on print) */}
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center z-50 print:hidden">
        <Link href="/bitcoin-initiative" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Volver a la Iniciativa
        </Link>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors shadow-lg">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Document Container */}
      <div className="max-w-4xl mx-auto pt-24 print:pt-0">
        <div className="bg-white shadow-2xl print:shadow-none mx-4 sm:mx-8 md:mx-auto mt-8 mb-16 print:m-0 print:w-full print:max-w-none">
          
          {/* Cover Page */}
          <div className="h-[1056px] w-full p-16 md:p-24 flex flex-col justify-center relative overflow-hidden page-break-after-always" style={{ pageBreakAfter: 'always' }}>
            <div className="absolute top-0 right-0 w-full h-full bg-[#F7931A]/5 pointer-events-none" />
            <div className="relative z-10">
              <span className="font-serif font-bold tracking-widest uppercase text-sm block mb-1">Pandoras</span>
              <span className="text-[10px] uppercase tracking-widest text-[#F7931A] font-bold mb-16 block">Bitcoin Initiative</span>
              
              <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-8 leading-[1.1]">
                Pandoras Bitcoin Partnership Brief
              </h1>
              <p className="text-2xl text-gray-500 font-light max-w-2xl leading-relaxed border-l-4 border-[#F7931A] pl-6">
                Llevando Capital Bitcoin a Activos Reales. Propuesta Estratégica.
              </p>
              
              <div className="mt-32">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Fecha</p>
                <p className="text-lg font-serif">{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Page 1: The Opportunity & Vision */}
          <div className="min-h-[1056px] w-full p-16 md:p-24 flex flex-col page-break-after-always" style={{ pageBreakAfter: 'always' }}>
             <h2 className="text-3xl font-serif font-bold mb-8 pb-4 border-b border-gray-200 text-[#F7931A]">1. La Oportunidad y Visión</h2>
             
             <div className="space-y-8 text-lg leading-relaxed text-gray-700">
                <h3 className="text-2xl font-bold text-black">Bitcoin Resolvió la Escasez Digital. Ahora Viene el Acceso.</h3>
                <p>Durante los últimos años Bitcoin demostró que una comunidad global puede coordinar capital alrededor de un activo digital descentralizado. Sin embargo, millones de Bitcoin holders todavía enfrentan un problema fundamental:</p>
                
                <blockquote className="border-l-4 border-gray-300 pl-6 py-2 italic font-serif text-xl text-gray-500">
                  ¿Cómo acceder a activos productivos del mundo real sin abandonar la filosofía de soberanía, transparencia y eficiencia?
                </blockquote>
                
                <p>El mercado inmobiliario tradicional presenta grandes barreras como la alta inversión inicial, baja liquidez, procesos lentos, falta de transparencia y el difícil acceso internacional.</p>
                <p><strong>La Visión de Pandoras:</strong> Pandoras es una infraestructura tecnológica y financiera diseñada para estructurar activos inmobiliarios, crear representaciones digitales de derechos económicos, facilitar acceso global y transparentar la información del activo. No vendemos tecnología, construimos acceso.</p>
             </div>
          </div>

          {/* Page 2: Alignment & Assets */}
          <div className="min-h-[1056px] w-full p-16 md:p-24 flex flex-col page-break-after-always" style={{ pageBreakAfter: 'always' }}>
             <h2 className="text-3xl font-serif font-bold mb-8 pb-4 border-b border-gray-200 text-[#F7931A]">2. Alineación Bitcoin y Activos Génesis</h2>
             
             <div className="space-y-8 text-lg leading-relaxed text-gray-700">
                <h3 className="text-2xl font-bold text-black">La Alineación Ideal</h3>
                <p>Las comunidades Bitcoin comparten valores fundamentales con la visión Pandoras. Bitcoin representa capital paciente, mientras que el Real Estate representa valor histórico. Pandoras es el puente entre ambos mundos.</p>
                
                <div className="bg-gray-50 p-8 border border-gray-200 rounded-xl my-8">
                  <h4 className="font-bold mb-4">Filosofía Compartida:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Escasez verificable</strong> ↔ Activos reales verificables</li>
                    <li><strong>Transparencia</strong> ↔ Transparency Center</li>
                    <li><strong>Propiedad digital</strong> ↔ Derechos económicos digitales</li>
                    <li><strong>Participación global</strong> ↔ Acceso internacional</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-bold text-black mt-12">Activos Inmobiliarios Génesis</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold">S'Narai Bucerías</h4>
                    <p>El activo fundador hospitality premium que demuestra el modelo. Ofrece participación digital en un desarrollo ubicado en la Riviera Nayarit, con una economía basada en operación real.</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Vista Horizonte</h4>
                    <p>Una oportunidad residencial para explorar un modelo de participación inmobiliaria más abierto, con administración profesional y distribución global nativa.</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Page 3: Partnership & Roadmap */}
          <div className="min-h-[1056px] w-full p-16 md:p-24 flex flex-col page-break-after-always" style={{ pageBreakAfter: 'always' }}>
             <h2 className="text-3xl font-serif font-bold mb-8 pb-4 border-b border-gray-200 text-[#F7931A]">3. Partnership Estratégico y Roadmap</h2>
             
             <div className="space-y-8 text-lg leading-relaxed text-gray-700">
                <h3 className="text-2xl font-bold text-black">Conviértete en Founding Distribution Partner</h3>
                <p>Estamos buscando comunidades estratégicas que quieran participar en la construcción del primer canal Bitcoin-native para activos inmobiliarios.</p>
                <ul className="list-disc pl-6 space-y-4">
                  <li><strong>Crear el primer canal Bitcoin → Real Estate:</strong> Vía exclusiva para acceder a activos estructurados.</li>
                  <li><strong>Participar desde la fase inicial:</strong> Acceso temprano antes de la distribución masiva.</li>
                  <li><strong>Construir una relación permanente:</strong> Como socio estratégico, no como afiliado.</li>
                </ul>

                <h3 className="text-2xl font-bold text-black mt-12">Roadmap de Integración</h3>
                
                <div className="border-l-2 border-[#F7931A] pl-6 space-y-6 mt-6">
                  <div>
                    <h4 className="font-bold text-[#F7931A]">Fase 1 — Canal de Distribución Bitcoin</h4>
                    <p className="text-sm">Conectar capital Bitcoin con oportunidades inmobiliarias.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#F7931A]">Fase 2 — Infraestructura de Liquidación</h4>
                    <p className="text-sm">Explorar mecanismos para facilitar pagos utilizando infraestructura compatible con Bitcoin.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#F7931A]">Fase 3 — Red de Activos Reales</h4>
                    <p className="text-sm">Crear una red permanente para acceder a múltiples activos reales.</p>
                  </div>
                </div>
                
                <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                   <h3 className="text-2xl font-serif font-bold text-black mb-4">Construyamos la Primera Red Inmobiliaria Bitcoin</h3>
                   <p className="mb-6">Estamos explorando socios estratégicos para distribución, comunidad, educación y acceso temprano.</p>
                   <p className="font-bold text-xl text-[#F7931A]">Equipo de Iniciativa Pandoras</p>
                </div>
             </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}} />
    </div>
  );
}
