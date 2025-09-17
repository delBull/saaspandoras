"use client";

import { useFormContext } from "react-hook-form";
import { useState, useRef } from "react";
import type { FullProjectFormData } from "../multi-step-form";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";

// Componentes UI reutilizados (consistente con secciones anteriores)
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

const Textarea = ({ id, className = "", placeholder, rows = 6, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholder?: string; rows?: number }) => (
  <textarea 
    id={id}
    rows={rows}
    placeholder={placeholder}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 placeholder-gray-500 text-white resize-vertical
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

const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="text-red-400 text-xs mt-1">{children}</p>
);

const FileUpload = ({ id, accept = "*", className = "", onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { accept?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="relative">
    <input 
      id={id}
      type="file"
      accept={accept}
      onChange={onChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      {...props}
    />
    <div className={`
      w-full px-4 py-3 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg 
      text-center text-gray-400 hover:border-lime-500 hover:bg-lime-500/5 transition-all
      cursor-pointer ${className}
    `}>
      <UploadCloud className="w-5 h-5 mx-auto mb-1" />
      <p className="text-sm">Click para seleccionar archivo</p>
      <p className="text-xs mt-1 opacity-75">PDF hasta 10MB</p>
    </div>
  </div>
);

const DocumentPreview = ({ filename, fileUrl = "pdf", className = "" }: {
  filename: string;
  fileUrl: string;
  type?: "pdf" | "doc";
  className?: string;
}) => (
  <div className={`relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50 ${className}`}>
    <div className="p-4 text-center">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-white truncate max-w-full">{filename}</p>
      <p className="text-xs text-gray-400 mt-1">Documento cargado correctamente</p>
      {fileUrl && (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-lime-400 text-xs mt-2 hover:text-lime-300"
        >
          <ExternalLink className="w-3 h-3" />
          Ver documento
        </a>
      )}
    </div>
  </div>
);

export function ProjectSection5() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  const [valuationPreview, setValuationPreview] = useState<string | null>(null);
  const [dueDiligencePreview, setDueDiligencePreview] = useState<string | null>(null);

  const valuationDocumentUrl = watch("valuationDocumentUrl") ?? "";
  const dueDiligenceReportUrl = watch("dueDiligenceReportUrl") ?? "";

  // Manejo de upload documentos
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (url: string) => void, setField: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 10MB");
        return;
      }
      if (!file.type.includes('pdf') && !file.type.includes('document')) {
        toast.error("Solo se permiten archivos PDF y documentos de oficina");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPreview(url);
        setField(url); // En producción usar upload a cloud storage
        toast.success("Documento cargado correctamente");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValuationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setValuationPreview, (url) => setValue("valuationDocumentUrl", url));
  };

  const handleDueDiligenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setDueDiligencePreview, (url) => setValue("dueDiligenceReportUrl", url));
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Due Diligence y Cumplimiento Legal
        </h3>
        <p className="text-gray-400 mb-6">
          Proporciona la documentación legal y de cumplimiento requerida. Esta información es esencial para la aprobación.
        </p>
      </div>

      {/* Sección 1: Estatus Legal */}
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Estatus Legal del Activo
        </h4>
        
        <div>
          <Label htmlFor="legalStatus" required>Estatus Legal y Regulatorio</Label>
          <Textarea
            id="legalStatus"
            placeholder="Describe el estatus legal actual de tu proyecto/activo. Incluye:
- Jurisdicción de incorporación/operación
- Tipo de entidad legal (SA, SRL, DAO, etc.)
- Licencias y permisos obtenidos
- Cumplimiento con regulaciones locales (KYC/AML)
- Estructura de propiedad actual
- Cualquier litigio o problema legal pendiente
- Planes para cumplimiento regulatorio post-tokenización..."
            {...register("legalStatus")}
          />
          {errors.legalStatus && <ErrorMessage>{errors.legalStatus.message}</ErrorMessage>}
          
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <h5 className="font-medium text-blue-300">Importante: Cumplimiento Legal</h5>
            </div>
            <p className="text-sm text-blue-200">
              Esta sección es crítica para la aprobación. Los proyectos deben cumplir con todas las regulaciones locales 
              e internacionales aplicables a la tokenización de activos. Consulta con abogados especializados en blockchain 
              y securities law antes de continuar.
            </p>
          </div>
        </div>
      </div>

      {/* Sección 2: Documentos de Valuación */}
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documento de Valuación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload */}
            <div>
              <Label htmlFor="valuationDocument">Documento de Valuación (PDF requerido)</Label>
              <FileUpload
                id="valuationDocument"
                accept=".pdf"
                onChange={handleValuationUpload}
              />
              {errors.valuationDocumentUrl && <ErrorMessage>{errors.valuationDocumentUrl.message}</ErrorMessage>}
              <p className="text-xs text-gray-500 mt-2">
                Sube tu documento de valuación profesional realizado por una entidad certificada.
                Debe incluir metodología, supuestos y fecha reciente (máx. 6 meses).
              </p>
            </div>

            {/* Preview */}
            <div>
              {valuationPreview ? (
                <DocumentPreview 
                  filename="Valuación Profesional.pdf" 
                  fileUrl={valuationPreview}
                  className="max-h-64"
                />
              ) : valuationDocumentUrl && isValidUrl(valuationDocumentUrl) ? (
                <DocumentPreview 
                  filename="Valuación Profesional.pdf" 
                  fileUrl={valuationDocumentUrl}
                  className="max-h-64"
                />
              ) : (
                <div className="h-64 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">No hay documento de valuación</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Entidad Fiduciaria */}
        <div>
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Entidad Fiduciaria / Custodio
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fiduciaryEntity">Nombre de la Entidad Fiduciaria</Label>
              <Input
                id="fiduciaryEntity"
                placeholder="Ej: XYZ Trust Company, S.A. de C.V."
                {...register("fiduciaryEntity")}
              />
              {errors.fiduciaryEntity && <ErrorMessage>{errors.fiduciaryEntity.message}</ErrorMessage>}
              <p className="text-xs text-gray-500 mt-2">
                Entidad legal que actuará como custodio de los activos subyacentes y fiduciaria para los inversionistas.
                Debe estar regulada y tener experiencia en tokenización de activos.
              </p>
            </div>

            <div className="md:col-span-1">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h5 className="font-medium text-green-300">¿Por qué es importante?</h5>
                </div>
                <p className="text-sm text-green-200">
                  La entidad fiduciaria protege los intereses de los inversionistas y garantiza que los activos 
                  subyacentes estén correctamente custodiados. Es un requisito legal en la mayoría de jurisdicciones.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 4: Reporte de Due Diligence */}
        <div>
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Reporte de Due Diligence (Opcional pero recomendado)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload */}
            <div>
              <Label htmlFor="dueDiligenceReport">Reporte de Due Diligence (PDF)</Label>
              <FileUpload
                id="dueDiligenceReport"
                accept=".pdf"
                onChange={handleDueDiligenceUpload}
              />
              {errors.dueDiligenceReportUrl && <ErrorMessage>{errors.dueDiligenceReportUrl.message}</ErrorMessage>}
              <p className="text-xs text-gray-500 mt-2">
                Reporte independiente de due diligence realizado por una firma especializada. 
                Aumenta significativamente la confianza de los inversionistas.
              </p>
            </div>

            {/* Preview */}
            <div>
              {dueDiligencePreview ? (
                <DocumentPreview 
                  filename="Reporte Due Diligence.pdf" 
                  fileUrl={dueDiligencePreview}
                  className="max-h-64"
                />
              ) : dueDiligenceReportUrl && isValidUrl(dueDiligenceReportUrl) ? (
                <DocumentPreview 
                  filename="Reporte Due Diligence.pdf" 
                  fileUrl={dueDiligenceReportUrl}
                  className="max-h-64"
                />
              ) : (
                <div className="h-64 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">No hay reporte de due diligence</p>
                  <p className="text-xs text-gray-500 mt-1">Recomendado para generar confianza</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Consejo Legal */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
        <h5 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" />
          Consejo Legal Crítico
        </h5>
        <p className="text-xs text-purple-200">
          <strong>Compliance es no negociable:</strong> La tokenización de activos está sujeta a regulaciones complejas 
          en la mayoría de jurisdicciones. Tu proyecto debe cumplir con securities laws, AML/KYC, y regulaciones locales. 
          Trabaja con abogados especializados en blockchain y securities. La documentación incompleta o inadecuada 
          resultará en rechazo automático de la aplicación.
        </p>
      </div>
    </div>
  );
}