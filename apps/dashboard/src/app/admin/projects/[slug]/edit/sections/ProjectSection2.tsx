"use client";

import { useFormContext } from "react-hook-form";
import type { FullProjectFormData } from "../multi-step-form";
import { toast } from "sonner";

// Componentes UI reutilizados
const Input = ({ id, type = "url", className = "", placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) => (
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

const LinkPreview = ({ url, title, description }: { url: string; title?: string; description?: string }) => (
  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mt-2">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title ?? "Enlace"}</p>
        <p className="text-xs text-gray-400 truncate">{url}</p>
        {description && <p className="text-xs text-gray-300 mt-1 line-clamp-2">{description}</p>}
      </div>
    </div>
  </div>
);

export function ProjectSection2() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  
  const website = watch("website");
  const whitepaperUrl = watch("whitepaperUrl");
  const twitterUrl = watch("twitterUrl");
  const discordUrl = watch("discordUrl");
  const telegramUrl = watch("telegramUrl");
  const linkedinUrl = watch("linkedinUrl");

  const handleUrlChange = (field: keyof FullProjectFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    // No validamos inmediatamente para permitir escritura manual
    setValue(field, url);
  };

  const handleUrlBlur = (field: keyof FullProjectFormData) => (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    if (url && url.length > 0) {
      // Solo validar y corregir el formato básico
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Corregir automáticamente añadiendo https:// si no tiene protocolo
        setValue(field, 'https://' + url.replace(/^https?:\/\//, ''));
      } else {
        // Solo limpiar si no puede crear URL válida
        try {
          new URL(url);
        } catch {
          if (url.includes('.') && url.length > 3) {
            // Permitir URLs que probablemente sean válidas
            return;
          }
          toast.error("Formato de URL inválido");
          setValue(field, "");
        }
      }
    }
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
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">📱 Enlaces Externos y Comunidad</h3>
        <p className="text-gray-400 mb-6">
          Estos enlaces permitirán a los inversionistas realizar su propia investigación (DYOR). 
          Todos los enlaces serán públicos en tu página de proyecto.
        </p>
      </div>

      {/* Sitio Web Oficial */}
      <div>
        <Label htmlFor="website" required>Sitio Web Oficial</Label>
        <Input
          id="website"
          type="text"
          placeholder="https://tu-proyecto.com"
          {...register("website", { required: false })}
          onChange={handleUrlChange("website")}
          onBlur={handleUrlBlur("website")}
        />
        {errors.website && <ErrorMessage>{errors.website.message}</ErrorMessage>}
        {website && isValidUrl(website) && (
          <LinkPreview
            url={website}
            title="Sitio Web Oficial"
            description="Página principal del proyecto donde los inversionistas pueden encontrar más información"
          />
        )}
        <p className="text-xs text-gray-500 mt-1">
          URL principal de tu proyecto. Debe ser accesible públicamente.
        </p>
      </div>

      {/* White Paper / Prospecto */}
      <div>
        <Label htmlFor="whitepaperUrl">White Paper / Prospecto de Inversión (PDF)</Label>
        <Input
          id="whitepaperUrl"
          type="text"
          placeholder="https://tu-proyecto.com/whitepaper.pdf"
          {...register("whitepaperUrl", { required: false })}
          onChange={handleUrlChange("whitepaperUrl")}
          onBlur={handleUrlBlur("whitepaperUrl")}
        />
        {errors.whitepaperUrl && <ErrorMessage>{errors.whitepaperUrl.message}</ErrorMessage>}
        {whitepaperUrl && isValidUrl(whitepaperUrl) && whitepaperUrl.endsWith('.pdf') && (
          <LinkPreview
            url={whitepaperUrl}
            title="White Paper / Prospecto"
            description="Documento detallado con toda la información técnica, financiera y legal del proyecto"
          />
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enlace directo al PDF del whitepaper o prospecto de inversión. Muy recomendado para generar confianza.
        </p>
      </div>

      {/* Redes Sociales */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Comunidad y Redes Sociales
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Twitter/X */}
          <div>
            <Label htmlFor="twitterUrl">X (Twitter)</Label>
            <Input
              id="twitterUrl"
              type="text"
              placeholder="https://twitter.com/tu-proyecto"
              {...register("twitterUrl", { required: false })}
              onChange={handleUrlChange("twitterUrl")}
              onBlur={handleUrlBlur("twitterUrl")}
            />
            {twitterUrl && isValidUrl(twitterUrl) && twitterUrl.includes('twitter.com') && (
              <LinkPreview
                url={twitterUrl}
                title="@TuProyecto"
                description="Cuenta oficial en X/Twitter donde compartimos actualizaciones"
              />
            )}
          </div>

          {/* Discord */}
          <div>
            <Label htmlFor="discordUrl">Discord (si aplica)</Label>
            <Input
              id="discordUrl"
              type="text"
              placeholder="https://discord.gg/tu-invite"
              {...register("discordUrl", { required: false })}
              onChange={handleUrlChange("discordUrl")}
              onBlur={handleUrlBlur("discordUrl")}
            />
            {discordUrl && isValidUrl(discordUrl) && discordUrl.includes('discord.gg') && (
              <LinkPreview
                url={discordUrl}
                title="Discord Community"
                description="Comunidad oficial en Discord para inversionistas y supporters"
              />
            )}
          </div>

          {/* Telegram */}
          <div>
            <Label htmlFor="telegramUrl">Telegram (si aplica)</Label>
            <Input
              id="telegramUrl"
              type="text"
              placeholder="https://t.me/tu-canal"
              {...register("telegramUrl", { required: false })}
              onChange={handleUrlChange("telegramUrl")}
              onBlur={handleUrlBlur("telegramUrl")}
            />
            {telegramUrl && isValidUrl(telegramUrl) && telegramUrl.includes('t.me') && (
              <LinkPreview
                url={telegramUrl}
                title="Telegram Channel"
                description="Canal oficial de Telegram para noticias y actualizaciones"
              />
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn de la Empresa</Label>
            <Input
              id="linkedinUrl"
              type="text"
              placeholder="https://linkedin.com/company/tu-empresa"
              {...register("linkedinUrl", { required: false })}
              onChange={handleUrlChange("linkedinUrl")}
              onBlur={handleUrlBlur("linkedinUrl")}
            />
            {linkedinUrl && isValidUrl(linkedinUrl) && linkedinUrl.includes('linkedin.com') && (
              <LinkPreview
                url={linkedinUrl}
                title="LinkedIn Company"
                description="Perfil oficial de LinkedIn de la empresa/emprendimiento"
              />
            )}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Consejo Importante
          </h5>
          <p className="text-xs text-blue-200">
            Todos los enlaces serán públicos y clickeables en tu página de proyecto. Asegúrate de que sean enlaces oficiales y estén activos.
            Los inversionistas usarán estos enlaces para hacer su propia investigación (DYOR).
          </p>
        </div>
      </div>
    </div>
  );
}
