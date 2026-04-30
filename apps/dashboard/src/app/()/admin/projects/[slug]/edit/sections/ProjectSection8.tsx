"use client";

import { useFormContext } from "react-hook-form";
import { Shield, FileText, Link as LinkIcon, AlertCircle } from "lucide-react";
import type { FullProjectFormData } from "../multi-step-form";

const Input = ({ id, type = "text", className = "", placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) => (
  <input 
    id={id}
    type={type}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white
      ${className}
    `} 
    {...props}
  />
);

const TextArea = ({ id, className = "", placeholder, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholder?: string }) => (
  <textarea 
    id={id}
    placeholder={placeholder}
    rows={8}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white font-mono text-sm
      ${className}
    `} 
    {...props}
  />
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

export function ProjectSection8() {
  const { register, watch } = useFormContext<FullProjectFormData>();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Configuración Legal-Tech (NOM-151)
        </h3>
        <p className="text-gray-400 mb-6">
          Define los parámetros para la generación automática de certificados de integridad y contratos de participación.
        </p>
      </div>

      {/* Template de Acuerdo */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <Label className="text-base mb-1">Template de Acuerdo de Participación</Label>
            <p className="text-xs text-gray-500">
              El contenido legal que se firmará digitalmente. Puedes usar variables dinámicas como <code className="text-emerald-400">{`{token_id}`}</code>, <code className="text-emerald-400">{`{wallet_address}`}</code>, etc.
            </p>
          </div>
        </div>

        <TextArea 
          id="legalTemplate"
          placeholder="Ej: Este Acuerdo de Participación vincula a la wallet {wallet_address} con el activo {token_id}..."
          {...register("legalConfig.template")}
        />
        
        <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
          <p className="text-xs text-emerald-200/70 leading-relaxed">
            <strong>Nota:</strong> Si dejas este campo vacío, el sistema utilizará el template estándar de Pandoras. Los cambios en este template solo afectarán a las nuevas compras.
          </p>
        </div>
      </div>

      {/* Enlaces Externos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-5 h-5 text-emerald-400" />
            <Label className="mb-0">Dossier Legal Maestro (PDF)</Label>
          </div>
          <Input 
            id="masterDocumentUrl"
            placeholder="https://tu-proyecto.com/legal/dossier.pdf"
            {...register("legalConfig.masterDocumentUrl")}
          />
          <p className="text-xs text-gray-500 mt-2">
            URL público del documento legal completo (Master Terms).
          </p>
        </div>

        <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <Label className="mb-0">Prefijo de Certificado</Label>
          </div>
          <Input 
            id="certPrefix"
            placeholder="Ej: AG-SNA-"
            {...register("legalConfig.certPrefix")}
          />
          <p className="text-xs text-gray-500 mt-2">
            Identificador para tus acuerdos (ej: AG-SNA-001).
          </p>
        </div>
      </div>
    </div>
  );
}
