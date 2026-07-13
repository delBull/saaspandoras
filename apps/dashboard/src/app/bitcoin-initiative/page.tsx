'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Bitcoin, Building, ShieldCheck, TrendingUp, Globe, FileText, CheckCircle2, X } from 'lucide-react';
import { submitPartnershipContact } from './actions';

export default function BitcoinInitiativePage() {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('loading');
    const formData = new FormData(e.currentTarget);
    const result = await submitPartnershipContact(formData);
    setFormStatus(result.success ? 'success' : 'error');
    setFormMessage(result.message);
  };

  return (
    <div className="bg-[#050905] text-white min-h-screen selection:bg-[#F7931A]/30 font-sans overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#F7931A]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050905]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
               <img src="/images/logo_green.png" alt="Pandoras Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="hidden md:block">
              <span className="font-serif font-bold tracking-widest uppercase text-sm block">Pandoras</span>
              <span className="text-[9px] uppercase tracking-widest text-[#F7931A] font-bold">Bitcoin Initiative</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/bitcoin-initiative/brief" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              <FileText size={16} /> Leer Partnership Brief
            </Link>
            <a href="#partner" className="px-6 py-2.5 bg-[#F7931A] hover:bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_20px_rgba(247,147,26,0.3)]">
              Convertirse en Partner
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Bitcoin size={16} className="text-[#F7931A]" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Propuesta de Partnership Estratégico</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-8 leading-[1.1]">
              Conectando Comunidades Bitcoin con <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-white italic">Real Estate Institucional</span>
            </h1>
            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Bitcoin creó una nueva clase de activos digitales con una visión global, soberana y de largo plazo. Pandoras está construyendo la infraestructura para conectar esa liquidez con activos reales: desarrollos inmobiliarios, hospitality y oportunidades respaldadas por economía física.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#partner" className="px-10 py-5 bg-[#F7931A] hover:bg-white text-black font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(247,147,26,0.3)] hover:scale-105">
                Explorar Partnership <ArrowRight size={20} />
              </a>
              <Link href="/bitcoin-initiative/brief" className="px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-3">
                <FileText size={20} /> Leer Documento Completo
              </Link>
            </div>
          </motion.div>
        </section>

        {/* 1. THE OPPORTUNITY */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">01. La Oportunidad</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Bitcoin Resolvió la Escasez Digital. Ahora Viene el Acceso.</h2>
              <p className="text-white/60 mb-6 text-lg leading-relaxed">
                Durante los últimos años Bitcoin demostró que una comunidad global puede coordinar capital alrededor de un activo digital descentralizado. Sin embargo, millones de Bitcoin holders todavía enfrentan un problema:
              </p>
              <blockquote className="border-l-2 border-[#F7931A] pl-6 py-2 my-8 text-xl font-serif italic text-white/90">
                "¿Cómo acceder a activos productivos del mundo real sin abandonar la filosofía de soberanía, transparencia y eficiencia?"
              </blockquote>
              <p className="text-white/60 text-lg leading-relaxed">
                El mercado inmobiliario tradicional presenta barreras: Alta inversión inicial, baja liquidez, procesos lentos, falta de transparencia y difícil acceso internacional. Pandoras busca resolver esta desconexión.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={200} /></div>
               <div className="relative z-10 space-y-8">
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0 border border-red-500/20"><X size={20} /></div>
                   <div>
                     <h4 className="font-bold text-lg mb-1">Real Estate Tradicional</h4>
                     <p className="text-white/40 text-sm">Altas barreras de entrada, burocracia, opacidad y fronteras geográficas.</p>
                   </div>
                 </div>
                 <div className="w-px h-8 bg-white/10 ml-6" />
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-[#F7931A]/10 text-[#F7931A] rounded-full flex items-center justify-center shrink-0 border border-[#F7931A]/30"><CheckCircle2 size={20} /></div>
                   <div>
                     <h4 className="font-bold text-lg mb-1">Infraestructura Pandoras</h4>
                     <p className="text-white/40 text-sm">Derechos económicos digitales, transparencia inmutable y acceso global sin fronteras.</p>
                   </div>
                 </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* 2. THE PANDORAS VISION */}
        <section className="bg-white/5 py-32 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">02. La Visión</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-10">Una Nueva Capa de Infraestructura Para Activos Reales</h2>
            <p className="text-xl text-white/60 mb-16 leading-relaxed">
              Pandoras es una infraestructura tecnológica y financiera diseñada para estructurar activos inmobiliarios, crear representaciones digitales de derechos económicos, facilitar acceso global, transparentar información y conectar comunidades con oportunidades verificadas.
            </p>
            <div className="inline-block bg-[#121212] border border-white/10 rounded-2xl px-12 py-8 shadow-2xl">
              <p className="font-serif italic text-3xl font-light">"No vendemos tecnología. <br/> <strong className="text-[#F7931A] not-italic">Construimos acceso.</strong>"</p>
            </div>
          </div>
        </section>

        {/* 3. WHY BITCOIN COMMUNITIES */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">03. La Alineación</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">¿Por qué Comunidades Bitcoin?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-[#121212] p-10 rounded-[2rem] border border-white/5">
               <h3 className="text-2xl font-bold mb-8 flex items-center gap-3"><Bitcoin className="text-[#F7931A]" /> Filosofía Bitcoin</h3>
               <ul className="space-y-6">
                 {['Escasez verificable', 'Transparencia', 'Propiedad digital', 'Participación global', 'Visión a largo plazo'].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-white/80"><div className="w-2 h-2 bg-white/20 rounded-full" /> {item}</li>
                 ))}
               </ul>
            </div>
            <div className="bg-[#121212] p-10 rounded-[2rem] border border-white/5">
               <h3 className="text-2xl font-bold mb-8 flex items-center gap-3"><ShieldCheck className="text-white" /> Infraestructura Pandoras</h3>
               <ul className="space-y-6">
                 {['Activos reales verificables', 'Transparency Center', 'Derechos económicos digitales', 'Acceso internacional', 'Inversión patrimonial'].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-[#F7931A] font-medium"><div className="w-2 h-2 bg-[#F7931A] rounded-full" /> {item}</li>
                 ))}
               </ul>
            </div>
          </div>
          
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-2xl font-serif italic text-white/80">
              "Bitcoin representa capital paciente. El Real Estate representa valor histórico. <strong className="text-white not-italic">Pandoras conecta ambos mundos.</strong>"
            </p>
          </div>
        </section>

        {/* 4. STRATEGIC PARTNERSHIP */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#050505] border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F7931A]/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
             
             <div className="relative z-10 max-w-3xl">
               <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">04. La Oportunidad</span>
               <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Conviértete en Founding Distribution Partner</h2>
               <p className="text-xl text-white/60 mb-16">
                 Estamos buscando comunidades estratégicas que quieran participar en la construcción del primer canal Bitcoin-native para activos inmobiliarios.
               </p>

               <div className="space-y-12">
                 <div>
                   <h4 className="text-2xl font-bold mb-2 flex items-center gap-4">
                     <span className="text-[#F7931A] font-mono text-sm border border-[#F7931A]/30 w-8 h-8 flex items-center justify-center rounded-full">1</span> 
                     Crear el primer canal Bitcoin → Real Estate
                   </h4>
                   <p className="text-white/50 pl-12 text-lg">Una vía exclusiva para que su comunidad acceda a activos inmobiliarios estructurados.</p>
                 </div>
                 <div>
                   <h4 className="text-2xl font-bold mb-2 flex items-center gap-4">
                     <span className="text-[#F7931A] font-mono text-sm border border-[#F7931A]/30 w-8 h-8 flex items-center justify-center rounded-full">2</span> 
                     Participar desde la fase inicial
                   </h4>
                   <p className="text-white/50 pl-12 text-lg">Acceso temprano a oportunidades seleccionadas antes de la distribución masiva.</p>
                 </div>
                 <div>
                   <h4 className="text-2xl font-bold mb-2 flex items-center gap-4">
                     <span className="text-[#F7931A] font-mono text-sm border border-[#F7931A]/30 w-8 h-8 flex items-center justify-center rounded-full">3</span> 
                     Construir una relación permanente
                   </h4>
                   <p className="text-white/50 pl-12 text-lg">No como afiliado. Como socio estratégico dentro del ecosistema Pandoras.</p>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* 5 & 7. ASSETS */}
        <section className="py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">05. Los Activos</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold">Activos Inmobiliarios Génesis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="group rounded-[3rem] border border-white/10 overflow-hidden bg-[#121212]">
                <div className="h-64 bg-zinc-900 relative">
                  {/* Placeholder for S'Narai render */}
                  <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <Building size={64} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
                </div>
                <div className="p-10 relative z-10 -mt-10">
                  <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Hospitality Premium</span>
                  <h3 className="text-3xl font-serif font-bold mb-4">S'Narai Bucerías</h3>
                  <p className="text-white/50 mb-6">El activo fundador que demuestra el modelo. Un desarrollo premium en la Riviera Nayarit con infraestructura de transparencia y participación digital sobre la economía real.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Modelo de participación inmobiliaria</li>
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Infraestructura de transparencia (Dashboard)</li>
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Economía basada en operación real</li>
                  </ul>
                </div>
              </div>

              <div className="group rounded-[3rem] border border-white/10 overflow-hidden bg-[#121212]">
                <div className="h-64 bg-zinc-900 relative">
                  {/* Placeholder for Vista Horizonte render */}
                  <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <Building size={64} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
                </div>
                <div className="p-10 relative z-10 -mt-10">
                  <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Expansión Residencial</span>
                  <h3 className="text-3xl font-serif font-bold mb-4">Vista Horizonte</h3>
                  <p className="text-white/50 mb-6">Una estructura diseñada para explorar un modelo de participación inmobiliaria más abierto. Administración profesional y distribución global nativa.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Activo inmobiliario residencial real</li>
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Potencial integración con comunidades Bitcoin</li>
                    <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={16} className="text-[#F7931A]" /> Participación económica estructurada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. ROADMAP */}
        <section className="bg-[#0A0A0A] py-32 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">06. Roadmap</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold">Construyendo El Puente</h2>
            </div>

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {[
                { phase: 'Fase 1', title: 'Canal de Distribución Bitcoin', desc: 'Crear una comunidad Bitcoin especializada dentro del ecosistema Pandoras. Conectar capital Bitcoin con oportunidades inmobiliarias de alta calidad.' },
                { phase: 'Fase 2', title: 'Infraestructura de Liquidación Bitcoin', desc: 'Explorar mecanismos para facilitar ingresos, pagos y participación utilizando infraestructura compatible y amigable con Bitcoin de forma fluida.' },
                { phase: 'Fase 3', title: 'Red de Activos del Mundo Real Bitcoin', desc: 'Crear una red permanente donde comunidades globales de Bitcoin puedan acceder a un pipeline constante de múltiples activos productivos reales.' }
              ].map((step, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0A0A0A] bg-[#121212] group-hover:border-[#F7931A] transition-colors shadow-[0_0_0_4px_rgba(255,255,255,0.05)] text-white/50 group-hover:text-[#F7931A] font-bold z-10 shrink-0 md:mx-auto md:absolute md:left-1/2 md:-translate-x-1/2">
                    {i + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#121212] p-8 rounded-3xl border border-white/5 group-hover:border-white/10 transition-colors ml-auto md:mx-0">
                    <span className="text-[#F7931A] text-xs font-bold uppercase tracking-widest mb-2 block">{step.phase}</span>
                    <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                    <p className="text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. CONTACT FORM CTA */}
        <section id="partner" className="max-w-4xl mx-auto px-6 py-32">
          <div className="bg-[#121212] border border-white/10 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[#F7931A]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-[#F7931A] text-[10px] font-black uppercase tracking-widest mb-4 block">07. Colaboración</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Construyamos la Primera Red Inmobiliaria Bitcoin</h2>
              <p className="text-white/60 mb-12 max-w-2xl mx-auto text-lg">
                Los primeros aliados tendrán la oportunidad de participar en una nueva categoría: <br/> 
                <strong className="text-white">Bitcoin + Real Estate + Digital Ownership</strong>. <br/>
                No como espectadores. Como constructores.
              </p>

              {formStatus === 'success' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-8 rounded-2xl flex flex-col items-center">
                  <CheckCircle2 size={48} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Solicitud Recibida</h3>
                  <p>{formMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="text-left max-w-lg mx-auto space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">Tu Nombre</label>
                    <input type="text" name="name" required className="w-full bg-black/40 border border-white/10 focus:border-[#F7931A] rounded-xl px-5 py-4 text-white outline-none transition-colors" placeholder="Satoshi Nakamoto" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">Correo Electrónico</label>
                    <input type="email" name="email" required className="w-full bg-black/40 border border-white/10 focus:border-[#F7931A] rounded-xl px-5 py-4 text-white outline-none transition-colors" placeholder="satoshi@bitcoin.org" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">Comunidad / Organización</label>
                    <input type="text" name="community" className="w-full bg-black/40 border border-white/10 focus:border-[#F7931A] rounded-xl px-5 py-4 text-white outline-none transition-colors" placeholder="Nombre de la comunidad" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">Mensaje (Opcional)</label>
                    <textarea name="message" rows={3} className="w-full bg-black/40 border border-white/10 focus:border-[#F7931A] rounded-xl px-5 py-4 text-white outline-none transition-colors resize-none" placeholder="Cuéntanos acerca de tu comunidad..." />
                  </div>
                  
                  {formStatus === 'error' && (
                    <p className="text-red-400 text-sm text-center bg-red-500/10 py-3 rounded-lg">{formMessage}</p>
                  )}

                  <button 
                    type="submit" 
                    disabled={formStatus === 'loading'}
                    className="w-full py-5 bg-[#F7931A] hover:bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {formStatus === 'loading' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Enviando...
                      </>
                    ) : 'Iniciar Conversación'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>
      
      <footer className="border-t border-white/5 py-12 text-center text-white/30 text-sm">
        <p>&copy; {new Date().getFullYear()} Pandoras Growth OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
