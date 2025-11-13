// packages/marketing/src/components/EmailCaptureForm.tsx
'use client'

import React, { useState } from 'react'
import { EmailService, handleEmailSignup } from '../email/resend'

interface EmailCaptureFormProps {
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  onSubmit?: (email: string) => void
  className?: string
  emailService?: EmailService
  sendWelcomeEmail?: boolean
}

export function EmailCaptureForm({
  title = "Mantente al Día",
  description = "Recibe las últimas actualizaciones",
  placeholder = "tu@email.com",
  buttonText = "Suscribirse",
  onSubmit,
  className = "",
  emailService,
  sendWelcomeEmail = true
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsSubmitting(true)
    try {
      const success = await handleEmailSignup(email, {
        service: emailService,
        welcomeEmail: sendWelcomeEmail,
        onSuccess: () => {
          setStatus('success')
          onSubmit?.(email)
          setEmail('')
        },
        onError: (error) => {
          console.error('Error:', error)
          setStatus('error')
        }
      })

      if (!success) {
        setStatus('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <div className={`text-center p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
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
    <div className={`max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-4">
        {description}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
        >
          {isSubmitting ? 'Enviando...' : buttonText}
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