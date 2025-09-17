"use client";

import { Upload, Image as ImageIcon, Film, Tag } from "lucide-react";
import Image from "next/image";

import { useFormContext } from "react-hook-form";
import { useState } from "react";
import type { FullProjectFormData } from "../multi-step-form";
import { toast } from "sonner";

// Componentes UI reutilizados (mismo patrón que Section2)
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

const Textarea = ({ id, className = "", placeholder, rows = 4, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholder?: string; rows?: number }) => (
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

const Select = ({ id, className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select 
    id={id}
    className={`
      w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
      transition-all duration-200 text-white
      ${className}
    `}
    {...props}
  >
    {children}
  </select>
);

const FileUpload = ({ id, accept = "image/*", className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { accept?: string }) => (
  <div className="relative">
    <input
      id={id}
      type="file"
      accept={accept}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      {...props}
    />
    <div className={`
      w-full px-4 py-3 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg
      text-center text-gray-400 hover:border-lime-500 hover:bg-lime-500/5 transition-all
      cursor-pointer ${className}
    `}>
      <Upload className="w-5 h-5 mx-auto mb-1" />
      <p className="text-sm">Click para seleccionar archivo</p>
      <p className="text-xs mt-1">PNG/JPG hasta 5MB</p>
    </div>
  </div>
);

const ImagePreview = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => (
  src ? (
    <div className={`relative rounded-lg overflow-hidden border border-zinc-700 ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={768}
        height={192}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        Preview
      </div>
    </div>
  ) : null
);

export function ProjectSection1() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<FullProjectFormData>();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const videoPitch = watch("videoPitch");

  // Manejo de upload logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Solo se permiten archivos de imagen (PNG, JPG, SVG)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        // Simular URL para preview (en producción usar Cloudinary/Supabase)
        setValue("logoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejo de upload cover photo
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Solo se permiten archivos de imagen (JPG, PNG)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
        setValue("coverPhotoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validación de video URL
  const isValidVideoUrl = (url: string) => {
    if (!url) return true;
    return url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('youtu.be');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Identidad del Proyecto
        </h3>
        <p className="text-gray-400 mb-6">
          Define la identidad visual y conceptual de tu proyecto. Esta información aparecerá en la página pública.
        </p>
      </div>

      {/* Título */}
      <div>
        <Label htmlFor="title" required>Título del Proyecto</Label>
        <Input
          id="title"
          placeholder="Ej: Mi Startup Tokenizada"
          maxLength={256}
          {...register("title", { required: "El título es requerido", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
        />
        {errors.title && <ErrorMessage>{errors.title.message}</ErrorMessage>}
        <p className="text-xs text-gray-500 mt-1">
          Título descriptivo y memorable (máx. 256 caracteres)
        </p>
      </div>

      {/* Tagline */}
      <div>
        <Label htmlFor="tagline">Tagline / Eslogan</Label>
        <Input
          id="tagline"
          placeholder='Ej: "Revolucionando la inversión en bienes raíces"'
          maxLength={140}
          {...register("tagline")}
        />
        {errors.tagline && <ErrorMessage>{errors.tagline.message}</ErrorMessage>}
        <p className="text-xs text-gray-500 mt-1">
          Frase corta y atractiva (máx. 140 caracteres) que resuma tu propuesta de valor
        </p>
      </div>

      {/* Categoría de Negocio */}
      <div>
        <Label htmlFor="businessCategory" required>Categoría de Negocio</Label>
        <Select id="businessCategory" {...register("businessCategory")}>
          <option value="">Selecciona una categoría</option>
          <option value="residential_real_estate">Bienes Raíces Residencial</option>
          <option value="commercial_real_estate">Bienes Raíces Comercial</option>
          <option value="tech_startup">Startup Tecnológica</option>
          <option value="renewable_energy">Energías Renovables</option>
          <option value="art_collectibles">Arte y Coleccionables</option>
          <option value="intellectual_property">Propiedad Intelectual</option>
          <option value="other">Otro</option>
        </Select>
        {errors.businessCategory && <ErrorMessage>{errors.businessCategory.message}</ErrorMessage>}
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la categoría principal de tu proyecto para mejor visibilidad
        </p>
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="description" required>Descripción Detallada</Label>
        <Textarea
          id="description"
          placeholder="Describe tu proyecto en detalle, incluyendo el problema que resuelve, solución propuesta, mercado objetivo y propuesta de valor única..."
          {...register("description")}
        />
        {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
        <p className="text-xs text-gray-500 mt-1">
          Descripción completa del proyecto (mín. 10 caracteres). Esta aparecerá en la página pública.
        </p>
      </div>

      {/* Logo */}
      <div>
        <Label htmlFor="logo">Logo del Proyecto</Label>
        <FileUpload
          id="logo"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleLogoUpload}
        />
        {errors.logoUrl && <ErrorMessage>{errors.logoUrl.message}</ErrorMessage>}
        {logoPreview && (
          <div className="mt-4">
            <Label>Preview del Logo</Label>
            <ImagePreview 
              src={logoPreview} 
              alt="Preview del logo"
              className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Logo en PNG/SVG (recomendado 512x512px). Debe ser tu logo oficial y de alta calidad.
        </p>
      </div>

      {/* Foto de Portada */}
      <div>
        <Label htmlFor="coverPhoto">Foto de Portada</Label>
        <FileUpload
          id="coverPhoto"
          accept="image/jpeg,image/png"
          onChange={handleCoverUpload}
        />
        {errors.coverPhotoUrl && <ErrorMessage>{errors.coverPhotoUrl.message}</ErrorMessage>}
        {coverPreview && (
          <div className="mt-4">
            <Label>Preview de Portada</Label>
            <ImagePreview 
              src={coverPreview} 
              alt="Preview de portada"
              className="w-full max-w-md"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Imagen principal (JPG/PNG, máx. 1920x1080px). Será el fondo hero de tu página de proyecto.
        </p>
      </div>

      {/* Video Pitch */}
      <div>
        <Label htmlFor="videoPitch">Video Pitch (Opcional)</Label>
        <Input
          id="videoPitch"
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          {...register("videoPitch")}
        />
        {errors.videoPitch && <ErrorMessage>{errors.videoPitch.message}</ErrorMessage>}
        {videoPitch && !isValidVideoUrl(videoPitch) && (
          <ErrorMessage>No se aceptan URLs de video de YouTube o Vimeo</ErrorMessage>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enlace a tu video pitch en YouTube o Vimeo (máx. 3 minutos). Muy recomendado para captar atención.
        </p>
        {videoPitch && isValidVideoUrl(videoPitch) && (
          <div className="mt-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <h5 className="text-sm font-medium text-lime-400 mb-2 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Preview del Video
            </h5>
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <p className="text-gray-500 text-sm">Video listo para embed</p>
            </div>
          </div>
        )}
      </div>

      {/* Consejo */}
      <div className="bg-gradient-to-r from-lime-500/5 to-emerald-500/5 border border-lime-500/20 rounded-lg p-4">
        <h5 className="text-sm font-medium text-lime-300 mb-2 flex items-center gap-1">
          <ImageIcon className="w-4 h-4" />
          Consejo de Identidad Visual
        </h5>
        <p className="text-xs text-lime-200">
          Tu logo y foto de portada son lo primero que verán los inversionistas. Usa imágenes profesionales 
          que transmitan seriedad y confianza. El tagline debe ser impactante y memorable.
        </p>
      </div>
    </div>
  );
}