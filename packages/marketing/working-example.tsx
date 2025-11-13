// 🚀 VERSIÓN PRÁCTICA INMEDIATA - Sin errores TypeScript
// Copia este archivo a tu proyecto Next.js y úsalo directamente

'use client'

import React, { useState } from 'react'

// ===== TIPOS PARA TYPESCRIPT =====
interface HeroProps {
  title: string
  subtitle?: string
  description?: string
  cta?: {
    text: string
    href: string
    style: string
  }
  background?: {
    type: 'gradient' | 'image'
    value?: string
  }
}

interface EmailFormProps {
  title?: string
  description?: string
  onSubmit?: (email: string) => void
}

// ===== HERO SECTION COMPONENT =====
function HeroSection({ title, subtitle, description, cta, background }: HeroProps) {
  const backgroundStyle = background?.type === 'gradient' 
    ? { background: background.value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
    : {}
  
  return (
    <section className="min-h-screen flex items-center justify-center px-4" style={backgroundStyle}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Supertitle */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <span className="text-sm font-medium text-blue-400">La Evolución del Creador</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-2xl md:text-3xl mb-6 text-zinc-200">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        {cta && (
          <a
            href={cta.href}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/25"
          >
            {cta.text}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}

// ===== EMAIL FORM COMPONENT =====
function EmailCaptureForm({ title, description, onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsSubmitting(true)
    try {
      // Aquí puedes integrar con tu API, Resend, Mailchimp, etc.
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStatus('success')
      onSubmit?.(email)
      setEmail('')
    } catch (error) {
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-green-600 mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-1">
          ¡Gracias por suscribirte!
        </h3>
        <p className="text-green-600">
          Te mantendremos informado sobre las mejores herramientas para creadores.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title || "Mantente al Día"}
      </h3>
      <p className="text-gray-600 mb-4">
        {description || "Recibe las últimas actualizaciones"}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md"
        >
          {isSubmitting ? 'Enviando...' : 'Suscribirse'}
        </button>
      </form>
      
      {status === 'error' && (
        <p className="text-red-600 text-sm mt-2 text-center">
          Algo salió mal. Por favor intenta de nuevo.
        </p>
      )}
    </div>
  )
}

// ===== TU PÁGINA DE LANDING COMPLETA =====
export default function StartLandingPage() {
  const [subscribers, setSubscribers] = useState<string[]>([])

  const handleEmailCapture = async (email: string) => {
    console.log('📧 Nuevo suscriptor:', email)
    
    // Aquí puedes:
    // 1. Enviar a tu API
    // 2. Integrar con Resend
    // 3. Guardar en base de datos
    // 4. Enviar a Mailchimp, etc.
    
    setSubscribers(prev => [...prev, email])
    
    // Para integrar con Resend, descomenta esto:
    /*
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    if (response.ok) {
      // Enviar welcome email automáticamente
      await fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    }
    */
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 🎯 HERO SECTION */}
      <HeroSection
        title="Comunidades Reales."
        subtitle="Protocolos Digitales."
        description="¿Sigues construyendo en plataformas Web2 que te cobran 30% y son dueñas de tu audiencia? El mundo cambió. Los protocolos de utilidad te permiten crear incentivos reales, activar a tus usuarios y ser 100% soberano."
        cta={{
          text: "Empezar a Construir Gratis",
          href: "#signup",
          style: "primary"
        }}
        background={{
          type: "gradient",
          value: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
        }}
      />

      {/* 🔥 SECCIÓN DE PROBLEMAS */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Las 3 Barreras Ocultas de las Plataformas Web2
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-3">1. La Prisión de la Plataforma</h3>
              <p className="text-gray-300">¿Tu comunidad vive en Patreon, Discord o Facebook? Ellos ponen las reglas, se llevan el 30% y no eres dueño de tu audiencia.</p>
            </div>
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-3">2. El Virus de la Apatía</h3>
              <p className="text-gray-300">Tu comunidad es pasiva. Los 'Likes' y 'Follows' no pagan las cuentas y no construyen valor real.</p>
            </div>
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-3">3. La Barrera Técnica</h3>
              <p className="text-gray-300">Lanzar un token es caro, complejo y legalmente aterrador.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📧 FORMULARIO DE CAPTURA */}
      <section id="signup" className="py-20 px-4 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <EmailCaptureForm
            title="Mantente al Tanto"
            description="Recibe actualizaciones de la plataforma, nuevos módulos 'No-Code' y casos de uso para Creadores"
            onSubmit={handleEmailCapture}
          />
          
          {subscribers.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-green-400">✅ {subscribers.length} nuevos suscriptores registrados</p>
            </div>
          )}
        </div>
      </section>

      {/* 🚀 CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            El Futuro del Creador Ya Llegó
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Elige construir tu comunidad sobre bases soberanas y transparentes.
          </p>
          <button className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-bold text-base md:text-xl px-8 md:px-16 py-4 md:py-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-lime-500/25">
            Unirme a la Evolución del Creador
          </button>
        </div>
      </section>
    </div>
  )
}