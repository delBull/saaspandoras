'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
               <img src="/images/logo_gold.png" onError={(e) => (e.currentTarget.style.display = 'none')} alt="Pandoras Logo" className="w-5 h-5 object-contain" />
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
              Contactar
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        
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

        {/* THE PROBLEM & THESIS */}
        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">01. El Problema</span>
              <h2 className="text-4xl font-serif font-bold mb-6">El problema no es el patrimonio. Es la liquidez.</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                Miles de propietarios poseen activos con un valor considerable: hoteles, terrenos, edificios, desarrollos y propiedades familiares.
              </p>
              <p className="text-white/60 text-lg leading-relaxed">
                Sin embargo, gran parte de ese capital permanece inmovilizado durante años, limitando la capacidad de crecimiento y reinversión.
              </p>
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

        {/* HOW IT WORKS */}
        <section className="bg-[#0a0a0a] py-32 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block">03. Metodología</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold">Cómo Funciona</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Análisis del activo', icon: Search },
                { step: '2', title: 'Diseño del vehículo jurídico', icon: Scale },
                { step: '3', title: 'Modelo financiero', icon: LineChart },
                { step: '4', title: 'Infraestructura tecnológica', icon: Server },
                { step: '5', title: 'Captación de inversionistas', icon: Users },
                { step: '6', title: 'Operación', icon: Settings },
                { step: '7', title: 'Distribución', icon: ArrowDownToLine },
              ].map((item, i) => (
                <div key={i} className="bg-[#111] border border-white/5 hover:border-[#D4AF37]/30 transition-colors p-8 rounded-3xl relative group">
                  <div className="text-[#D4AF37]/20 font-serif text-6xl absolute top-4 right-6 font-black group-hover:text-[#D4AF37]/10 transition-colors">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 text-[#D4AF37] mb-6 relative z-10" />
                  <h4 className="text-xl font-bold relative z-10">{item.title}</h4>
                </div>
              ))}
              
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
                <p className="font-serif italic text-xl text-[#D4AF37]">Una estructuración end-to-end.</p>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES & VALUE PROP */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Para Quién</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              No todos los activos necesitan venderse. Algunos simplemente necesitan una mejor estructura. Pandoras ayuda a transformar activos improductivos en plataformas capaces de generar capital, liquidez y crecimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {[
              { title: 'Desarrollador', desc: 'Tiene terreno. Necesita construir.', icon: Building2 },
              { title: 'Hotel', desc: 'Activo en operación. Necesita remodelar.', icon: Building },
              { title: 'Familia Patrimonial', desc: 'Tiene departamentos. Quiere conservarlos.', icon: Users },
              { title: 'Constructor', desc: 'Tiene inventario. Necesita capital.', icon: Briefcase },
              { title: 'Inversionista', desc: 'Quiere entrar desde etapas tempranas.', icon: Coins },
              { title: 'Family Office', desc: 'Busca eficiencia patrimonial.', icon: Landmark },
            ].map((card, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/5 p-8 rounded-3xl flex items-start gap-5">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 text-[#D4AF37]">
                  <card.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{card.title}</h4>
                  <p className="text-sm text-white/50">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* WHAT WE OFFER */}
          <div className="bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-[3rem] p-12 md:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6">Lo que ofrece Pandoras</h3>
                <p className="text-white/50 text-lg mb-8">
                  No hablamos de tecnología superficial. Hablamos de soluciones institucionales profundas que habilitan el capital real.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['Estructuración', 'Capital', 'Patrimonio', 'Gobernanza', 'Transparencia', 'Trazabilidad'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="font-medium text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-l border-white/10 pl-0 lg:pl-12 pt-8 lg:pt-0 mt-8 lg:mt-0 border-t lg:border-t-0">
                <p className="font-serif italic text-2xl text-white/70 leading-relaxed">
                  "S'Narai no es solo nuestro primer proyecto.<br/>
                  <span className="text-white not-italic font-bold">Es la demostración de una capacidad: convertir patrimonio inmovilizado en capital productivo.</span>"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STRATEGIC TREASURY / VISION 2035 */}
        <section id="vision" className="bg-[#050505] py-32 border-t border-[#D4AF37]/20 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20">
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4 block text-center md:text-left">Vision 2035</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-center md:text-left">Pandoras Strategic Treasury</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-xl text-white/70 mb-8 leading-relaxed font-light">
                  Pandoras mantiene una tesorería respaldada por activos reales que constituye la base patrimonial sobre la cual se desarrolla el ecosistema.
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
                  Este activo representa el inicio de la estrategia de Asset Treasury de Pandoras y servirá como referencia para la incorporación futura de nuevos activos patrimoniales dentro del ecosistema. No somos intermediarios; estamos construyendo patrimonio propio.
                </p>
              </div>
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
