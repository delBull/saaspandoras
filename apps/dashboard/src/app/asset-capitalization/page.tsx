'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { submitAssetCapitalizationLead } from './actions';
import { 
  Building2, 
  Landmark, 
  Briefcase, 
  Users, 
  ArrowRight,
  Search,
  Scale,
  LineChart,
  Server,
  Coins,
  Settings,
  ArrowDownToLine,
  Check,
  Building
} from 'lucide-react';

export default function AssetCapitalizationPage() {
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAssetCapitalizationLead(formData);
      setFormState(result);
    });
  };

  return (
    <div className="bg-[#030303] text-[#F9F6EE] min-h-screen selection:bg-[#D4AF37]/30 font-sans overflow-hidden">
      {/* Background glow effects - Champagne / Gold */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[120px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />
      <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-[#C5B358]/5 blur-[150px] pointer-events-none rounded-full -translate-x-1/3 translate-y-1/3" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
               <img src="/logop.svg" onError={(e) => (e.currentTarget.style.display = 'none')} alt="Pandoras Logo" className="w-5 h-5 object-contain" />
               {!React.isValidElement(<img />) && <span className="font-serif italic font-bold text-[#D4AF37]">P</span>}
            </Link>
            <div className="hidden md:block">
              <span className="font-serif font-bold tracking-widest uppercase text-sm block text-white/90">Pandoras</span>
              <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">Asset Capitalization Playbook</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#vision" className="hidden md:block text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              Vision 2035
            </a>
            <a href="#contact" className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C5B358] text-black font-black text-[10px] uppercase tracking-widest rounded-full transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105">
              Solicitar Diagnóstico
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; }
        `}} />
        
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-8">
              <Landmark size={14} className="text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Capital Structuring</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight mb-8 leading-[1.1] text-white">
              ¿Y si tu patrimonio pudiera financiar tu siguiente proyecto... <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F9F6EE] italic font-light">sin tener que venderlo?</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Durante décadas, la única forma de obtener liquidez era vender el activo o hipotecarlo. Pandoras propone una tercera alternativa: <strong className="text-white font-medium">Capitalizar el patrimonio existente mediante una estructura institucional</strong> diseñada para atraer inversionistas sin perder el control del activo.
            </p>
          </motion.div>
        </section>

        {/* NUESTRA CAPACIDAD (CREDIBILITY) */}
        <section className="max-w-7xl mx-auto px-6 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4">Nuestra Capacidad</h3>
            <p className="text-2xl md:text-3xl font-serif font-bold mb-10">No hablamos de una idea. Construimos infraestructura institucional.</p>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
              {[
                'Pandoras Growth OS',
                'Plataforma operativa desarrollada',
                'Dashboard para inversionistas',
                'Gestión documental',
                'Founding Round activo',
                'Primera estructura patrimonial en ejecución'
              ].map((item, i) => (
                <div key={i} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                  <Check size={14} className="text-[#D4AF37]" />
                  <span className="text-sm font-medium text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CORE MESSAGE STRIP */}
        <div className="bg-[#D4AF37] text-black py-4 overflow-hidden whitespace-nowrap border-y border-[#C5B358]">
          <div className="animate-marquee inline-block font-black uppercase tracking-widest text-sm">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="mx-8">
                PANDORAS NO COMPRA ACTIVOS. PANDORAS NO ADMINISTRA ACTIVOS. PANDORAS ESTRUCTURA VEHÍCULOS.
              </span>
            ))}
          </div>
        </div>

        {/* THE PROBLEM & THESIS */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">01. El Problema</span>
              <h2 className="text-4xl font-serif font-bold mb-6">El problema no es el patrimonio. Es la liquidez.</h2>
              <div className="text-white/60 text-lg leading-relaxed space-y-4">
                <p>Durante décadas, los propietarios tuvieron únicamente dos opciones:</p>
                <ul className="list-disc pl-6 space-y-2 text-white/80">
                  <li>Vender</li>
                  <li>Hipotecar</li>
                </ul>
                <p className="text-xl font-medium text-white pt-4">Existe una tercera.</p>
                <p className="text-3xl font-serif font-bold text-[#D4AF37]">Capitalizar.</p>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[#111] p-10 md:p-12 rounded-[2rem] border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl" />
               <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">02. La Tesis</span>
               <h3 className="text-3xl font-serif font-bold mb-6">No vendemos patrimonio. Lo estructuramos.</h3>
               <p className="text-white/70 text-lg leading-relaxed mb-8">
                 Pandoras diseña vehículos de inversión para que un activo existente pueda convertirse en la base de una estructura de capital institucional.
               </p>
               <div className="border-l-2 border-[#D4AF37] pl-6 py-2 font-serif italic text-xl text-white/90">
                 No reemplazamos bancos.<br/>
                 No reemplazamos desarrolladores.<br/>
                 Creamos una nueva capa entre ambos.
               </div>
            </motion.div>
          </div>
        </section>

        {/* EVOLUTION (HOW IT WORKS) */}
        <section className="bg-[#0a0a0a] py-32 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 overflow-hidden">
            <div className="text-center mb-20">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">03. Metodología</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold">Tu activo evoluciona</h2>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">
              <div className="absolute top-8 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent hidden md:block" />
              {[
                { title: 'Activo existente', icon: Building2 },
                { title: 'Diagnóstico patrimonial', icon: Search },
                { title: 'Vehículo institucional', icon: Scale },
                { title: 'Capital privado', icon: Users },
                { title: 'Operación', icon: Settings },
                { title: 'Liquidez', icon: Coins },
                { title: 'Expansión', icon: ArrowRight },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-4 relative z-10 w-full md:w-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-[#111] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)] bg-[#0a0a0a]">
                    <item.icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70 md:max-w-[100px] leading-tight">{item.title}</span>
                  {i < 6 && <div className="w-[1px] h-8 bg-[#D4AF37]/30 block md:hidden" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TARGET AUDIENCE & WHAT WE OFFER */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
            <div>
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">04. Para Quién</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Trabajamos con</h2>
              <ul className="space-y-4">
                {[
                  'Patrimonios familiares',
                  'Desarrolladores',
                  'Operadores hoteleros',
                  'Empresas inmobiliarias',
                  'Empresarios con activos improductivos',
                  'Family Offices',
                  'Fondos privados'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl text-white/80 font-medium">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-[3rem] p-10 md:p-14">
              <h3 className="text-3xl font-serif font-bold mb-6">Pandoras convierte activos inmovilizados en infraestructura de capital.</h3>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                No desarrollamos únicamente proyectos. Diseñamos vehículos capaces de atraer inversión privada, preservar patrimonio y generar liquidez sin perder el control del activo.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {['Gobernanza', 'Transparencia', 'Capital', 'Distribución', 'Protección Patrimonial', 'Trazabilidad'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                      <Check size={14} />
                    </div>
                    <span className="font-medium text-white/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* USE CASES */}
          <div className="border-t border-white/5 pt-24">
            <div className="text-center mb-16">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">05. Casos de Uso</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">¿Te identificas con alguno?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Caso 1: Hotel Operativo', desc: 'Tengo un hotel funcionando. Necesito remodelarlo. No quiero vender.' },
                { title: 'Caso 2: Reserva Territorial', desc: 'Tengo un terreno. Necesito construir.' },
                { title: 'Caso 3: Inventario Inmobiliario', desc: 'Tengo departamentos. Necesito liquidez.' },
                { title: 'Caso 4: Sucesión', desc: 'Tengo patrimonio familiar. Quiero institucionalizarlo.' },
                { title: 'Caso 5: Capital Privado', desc: 'Soy inversionista. Quiero entrar antes del mercado.' },
              ].map((caseItem, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-[#D4AF37]/30 transition-colors">
                  <h4 className="text-[#D4AF37] font-bold mb-4">{caseItem.title}</h4>
                  <p className="text-white/80 text-lg font-serif italic">"{caseItem.desc}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STRATEGIC TREASURY / VISION 2035 */}
        <section id="vision" className="bg-[#050505] py-32 border-t border-[#D4AF37]/20 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block text-center md:text-left">Vision 2035</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-center md:text-left">Institutional Asset Reserve</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-2xl text-white/90 mb-8 leading-relaxed font-serif italic">
                  Nuestra fortaleza no proviene únicamente del flujo operativo. Proviene de una reserva estratégica de activos reales diseñada para fortalecer cada nuevo vehículo que construimos.
                </p>
                <p className="text-lg text-white/50 mb-12 leading-relaxed">
                  Nuestra visión es construir una tesorería diversificada compuesta por activos inmobiliarios, participaciones estratégicas y vehículos de inversión que fortalezcan la estabilidad y capacidad operativa de la plataforma.
                </p>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">Áreas Objetivo (2035)</h4>
                  <ul className="grid grid-cols-2 gap-y-4 gap-x-8">
                    {['Desarrollos inmobiliarios', 'Hoteles boutique', 'Activos turísticos', 'Tierra estratégica', 'Infraestructura productiva', 'Participaciones corporativas'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/60 text-sm">
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/10 rounded-[2rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Building size={150} /></div>
                
                <h4 className="text-xl font-serif font-bold mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  Estado Actual
                </h4>
                
                <p className="text-sm text-white/50 uppercase tracking-widest mb-2 font-bold">Primer activo estratégico identificado:</p>
                
                <div className="bg-black/50 rounded-2xl p-6 border border-white/5 mb-8">
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-white/60">Tipo</span>
                      <span className="font-bold">Activo residencial premium</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-white/60">Ubicación</span>
                      <span className="font-bold">Riviera Nayarit</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-white/60">Valor Aproximado</span>
                      <span className="font-bold text-[#D4AF37]">USD 450,000</span>
                    </li>
                  </ul>
                </div>

                <p className="text-white/50 text-sm leading-relaxed">
                  Este activo representa el inicio de la estrategia de Institutional Asset Reserve de Pandoras y servirá como referencia para la incorporación futura de nuevos activos patrimoniales dentro del ecosistema.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REITERATION MESSAGE STRIP */}
        <div className="bg-[#D4AF37] text-black py-4 overflow-hidden whitespace-nowrap border-y border-[#C5B358]">
          <div className="animate-marquee inline-block font-black uppercase tracking-widest text-sm">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="mx-8">
                PANDORAS NO COMPRA ACTIVOS. PANDORAS NO ADMINISTRA ACTIVOS. PANDORAS ESTRUCTURA VEHÍCULOS.
              </span>
            ))}
          </div>
        </div>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-24 border-t border-white/5 relative z-10 bg-[#020202]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">Aplicación</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Solicitar Diagnóstico Patrimonial</h2>
              <p className="text-white/50">Déjanos tus datos y un director de estructuración te contactará a la brevedad para analizar tu caso.</p>
            </div>

            <div className="bg-[#111] border border-white/5 p-8 md:p-12 rounded-[2rem]">
              {formState?.success ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-4 text-[#D4AF37]">Solicitud Recibida</h3>
                  <p className="text-white/60">{formState.message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formState?.message && !formState.success && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {formState.message}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Nombre Completo</label>
                      <input type="text" name="name" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors" placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Correo Electrónico</label>
                      <input type="email" name="email" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors" placeholder="correo@empresa.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Tipo de Activo</label>
                    <select name="assetType" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none">
                      <option value="">Seleccione una opción</option>
                      <option value="Desarrollo Inmobiliario">Desarrollo Inmobiliario (En Construcción)</option>
                      <option value="Hotel">Hotel / Hospitality</option>
                      <option value="Terreno">Terreno Estratégico</option>
                      <option value="Residencial">Inmueble Residencial Premium</option>
                      <option value="Comercial">Inmueble Comercial / Industrial</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Mensaje Adicional (Opcional)</label>
                    <textarea name="message" rows={4} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none" placeholder="Breve descripción del activo o su situación actual..."></textarea>
                  </div>

                  <button disabled={isPending} type="submit" className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#C5B358] text-black font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isPending ? 'Enviando...' : 'Solicitar Diagnóstico Patrimonial'}
                    {!isPending && <ArrowRight size={16} />}
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
