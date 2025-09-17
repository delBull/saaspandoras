"use client";

import { useFormContext } from "react-hook-form";
import type { FullProjectFormData } from "../multi-step-form";
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  CheckCircle
} from "lucide-react";

// Componentes UI reutilizados
const Input = ({ id, type = "text", className = "", placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) => (
  <input 
    id={id}
    type={type}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white
      ${className}
    `} 
    {...props}
  />
);

const Checkbox = ({ id, checked, onChange, className = "", children }: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={`flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 ${className}`}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-zinc-600 text-lime-500 focus:ring-lime-500 mt-0.5 w-4 h-4 cursor-pointer"
    />
    <div className="flex-1">
      <label htmlFor={id} className="text-sm text-white block cursor-pointer">
        {children}
      </label>
    </div>
  </div>
);

const Label = ({ htmlFor, children, required = false, className = "" }: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-semibold text-white mb-2 flex items-center gap-1 ${className}`}
  >
    {children}
    {required && <span className="text-red-400 text-xs">*</span>}
  </label>
);

const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    {children}
  </p>
);

const SuccessMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
    <CheckCircle2 className="w-3 h-3" />
    {children}
  </p>
);

export function ProjectSection7() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  
  const verificationAgreement = watch("verificationAgreement") || false;
  const applicantName = watch("applicantName") ?? "";
  const applicantEmail = watch("applicantEmail") ?? "";
  const applicantPhone = watch("applicantPhone") ?? "";

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Basic phone validation (allow international formats)
    return /^[+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("applicantEmail", value);
    
    if (value && !isValidEmail(value)) {
      // Don't show error immediately, let form validation handle it
    } else if (value && isValidEmail(value)) {
      // Optional: show success
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Clean input (remove non-digits except +)
    const cleaned = value.replace(/[^\d+]/g, '');
    setValue("applicantPhone", cleaned);
  };

  const handleAgreementToggle = (checked: boolean) => {
    setValue("verificationAgreement", checked);
    if (checked) {
      // Optional: scroll to top or highlight required fields
    }
  };

  const hasRequiredFields = applicantName && isValidEmail(applicantEmail) && applicantPhone;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <User className="w-5 h-5" />
          Información del Solicitante y Verificación Final
        </h3>
        <p className="text-gray-400 mb-6">
          Proporciona tus datos de contacto y acepta los términos. Esta es la última sección antes del envío.
        </p>
      </div>

      {/* Sección 1: Datos del Solicitante */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Información del Representante Legal
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nombre */}
          <div>
            <Label htmlFor="applicantName" required>Nombre Completo</Label>
            <Input
              id="applicantName"
              placeholder="Juan Pérez García"
              value={applicantName}
              {...register("applicantName")}
            />
            {errors.applicantName && <ErrorMessage>{errors.applicantName.message}</ErrorMessage>}
            <p className="text-xs text-gray-500 mt-1">
              Nombre completo del representante legal que firma la aplicación
            </p>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="applicantEmail" required>Correo Electrónico Corporativo</Label>
            <Input
              id="applicantEmail"
              type="email"
              placeholder="contacto@tu-empresa.com"
              value={applicantEmail}
              onChange={handleEmailChange}
              className={applicantEmail && !isValidEmail(applicantEmail) ? "border-red-500/50 focus:ring-red-500" : ""}
            />
            {errors.applicantEmail && <ErrorMessage>{errors.applicantEmail.message}</ErrorMessage>}
            {applicantEmail && isValidEmail(applicantEmail) && !errors.applicantEmail && (
              <SuccessMessage>Correo válido</SuccessMessage>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Debe ser una dirección corporativa, no Gmail/Hotmail. Recibirás notificaciones importantes aquí.
            </p>
          </div>

          {/* Teléfono */}
          <div>
            <Label htmlFor="applicantPhone" required>Número de Teléfono</Label>
            <Input
              id="applicantPhone"
              type="tel"
              placeholder="+52 55 1234 5678"
              value={applicantPhone}
              onChange={handlePhoneChange}
              className={applicantPhone && !isValidPhone(applicantPhone) ? "border-red-500/50 focus:ring-red-500" : ""}
            />
            {errors.applicantPhone && <ErrorMessage>{errors.applicantPhone.message}</ErrorMessage>}
            {applicantPhone && isValidPhone(applicantPhone) && !errors.applicantPhone && (
              <SuccessMessage>Número válido</SuccessMessage>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Número directo del representante. Incluye código de país (ej: +52 para México).
            </p>
          </div>
        </div>

        {/* Cargo del Solicitante */}
        <div className="mt-6">
          <Label htmlFor="applicantPosition">Tu Cargo en la Empresa</Label>
          <Input
            id="applicantPosition"
            placeholder="CEO, Director Legal, Fundador, etc."
            {...register("applicantPosition")}
          />
          {errors.applicantPosition && <ErrorMessage>{errors.applicantPosition.message}</ErrorMessage>}
          <p className="text-xs text-gray-500 mt-1">
            Especifica tu rol exacto en la empresa (ej: &quot;CEO & Fundador&quot;, &quot;Director de Operaciones&quot;)
          </p>
        </div>
      </div>

      {/* Sección 2: Acuerdo de Verificación Final */}
      <div className="bg-gradient-to-r from-lime-500/5 to-emerald-500/5 border border-lime-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 pt-1">
            <CheckCircle className="w-6 h-6 text-lime-400" />
          </div>
          
          <div className="flex-1">
            <h4 className="text-md font-semibold text-white mb-3">
              Acuerdo de Verificación y Responsabilidad
            </h4>
            
            <Checkbox
              id="verificationAgreement"
              checked={verificationAgreement}
              onChange={handleAgreementToggle}
              className="mb-4 p-4 bg-white/5 rounded-lg border-lime-500/30"
            >
              <div className="space-y-2">
                <p className="text-sm text-white">
                  <strong>Declaro bajo protesta de decir verdad que:</strong>
                </p>
                
                <div className="text-xs text-gray-300 space-y-1 pl-4">
                  <p>• Toda la información proporcionada en esta aplicación es veraz, completa y actual</p>
                  <p>• Soy el representante legal autorizado para presentar esta solicitud</p>
                  <p>• El proyecto cumple con todas las regulaciones aplicables en su jurisdicción</p>
                  <p>• Los documentos subidos son auténticos y no han sido alterados</p>
                  <p>• Me comprometo a proporcionar documentación adicional si se requiere</p>
                  <p>• Autorizo a Pandoras Foundation a verificar la información proporcionada</p>
                  <p>• Entiendo que información falsa puede resultar en rechazo inmediato y acciones legales</p>
                </div>
                
                <div className="pt-3 mt-3 border-t border-lime-500/20">
                  <p className="text-xs text-lime-300 font-medium">
                    <strong>Consecuencias de Declaración Falsa:</strong> Rechazo de aplicación, posible reporte a autoridades,
                    prohibición de futuras aplicaciones, y responsabilidad legal por fraude.
                  </p>
                </div>
              </div>
            </Checkbox>

            {verificationAgreement && hasRequiredFields && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h5 className="font-semibold text-green-300">¡Listo para Enviar!</h5>
                </div>
                <p className="text-sm text-green-200">
                  Has completado todos los requisitos. Tu aplicación está lista para revisión por el equipo de Pandoras Foundation.
                  El proceso de revisión puede tomar entre 5-15 días hábiles.
                </p>
              </div>
            )}

            {!verificationAgreement && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <h5 className="font-semibold text-yellow-300">Último Paso Requerido</h5>
                </div>
                <p className="text-sm text-yellow-200">
                  Debes aceptar el acuerdo de verificación para completar la aplicación. Esta declaración es legalmente vinculante.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información Final */}
      <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Confirmación de Contacto
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 font-medium">Representante:</span>
            </div>
            <p className={`font-mono ${applicantName ? "text-white" : "text-gray-500 italic"}`}>
              {applicantName || "Pendiente"}
            </p>
            <p className={`text-xs ${applicantName ? "text-green-400" : "text-gray-500"}`}>
              {applicantName ? "✓ Nombre confirmado" : "⚠️ Nombre requerido"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 font-medium">Email:</span>
            </div>
            <p className={`font-mono ${applicantEmail ? "text-white" : "text-gray-500 italic"}`}>
              {applicantEmail || "Pendiente"}
            </p>
            <p className={`text-xs ${isValidEmail(applicantEmail) && applicantEmail ? "text-green-400" : applicantEmail ? "text-red-400" : "text-gray-500"}`}>
              {applicantEmail ? (isValidEmail(applicantEmail) ? "✓ Email válido" : "✗ Email inválido") : "⚠️ Email requerido"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 font-medium">Teléfono:</span>
            </div>
            <p className={`font-mono ${applicantPhone ? "text-white" : "text-gray-500 italic"}`}>
              {applicantPhone || "Pendiente"}
            </p>
            <p className={`text-xs ${isValidPhone(applicantPhone) && applicantPhone ? "text-green-400" : applicantPhone ? "text-red-400" : "text-gray-500"}`}>
              {applicantPhone ? (isValidPhone(applicantPhone) ? "✓ Teléfono válido" : "✗ Teléfono inválido") : "⚠️ Teléfono requerido"}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-lime-400" />
              <span className="text-sm font-semibold text-white">Estado de la Aplicación:</span>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              verificationAgreement && hasRequiredFields 
                ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            }`}>
              {verificationAgreement && hasRequiredFields 
                ? "✅ LISTA PARA REVISIÓN" 
                : "⚠️ PENDIENTE DE VERIFICACIÓN"
              }
            </div>
          </div>
        </div>
      </div>

      {/* Nota Final */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
        <h4 className="text-md font-semibold text-purple-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Antes de Enviar
        </h4>
        
        <div className="text-sm text-purple-200 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
            <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Revisión del Proceso:</p>
              <ul className="space-y-1 text-xs">
                <li>• Has completado las 7 secciones requeridas</li>
                <li>• Todos los documentos están subidos y accesibles</li>
                <li>• La información legal es precisa y actual</li>
                <li>• Aceptaste el acuerdo de verificación</li>
                <li>• Tu información de contacto es correcta</li>
              </ul>
            </div>
          </div>
          
          <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
            <p className="text-xs font-medium text-purple-300 mb-1">Próximos Pasos Después del Envío:</p>
            <ul className="text-xs space-y-1">
              <li>• Recibirás confirmación por email en 24 horas</li>
              <li>• Revisión inicial por compliance (3-5 días)</li>
              <li>• Solicitudes de documentación adicional si aplica</li>
              <li>• Revisión final por comité (5-10 días adicionales)</li>
              <li>• Notificación de aprobación/rechazo con feedback</li>
            </ul>
          </div>
          
          <div className="pt-3 mt-3 border-t border-purple-500/20">
            <p className="text-xs text-purple-300">
              <strong>Tiempo Total Estimado:</strong> 7-15 días hábiles. Respuesta garantizada en máximo 20 días.
              Puedes contactar a support@pandoras.foundation si no recibes respuesta en ese plazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}