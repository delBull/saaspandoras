import { motion } from 'framer-motion';
import { useFormContext } from 'react-hook-form';
import Image from 'next/image';
import { useState } from 'react';

interface FileInputProps {
  name: string;
  accept?: string;
  placeholder?: string;
  info?: string;
}

export function FileInput({ name, accept = "image/*", placeholder, info: _info }: FileInputProps) {
  const { formState: { errors }, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Observar el valor actual del campo para mostrar feedback
  const currentValue = watch(name) as string;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    setIsUploading(true);
    setUploadStatus('idle');

    // Validar tamaño (ahora permitimos hasta 10MB porque lo comprimiremos)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      setUploadStatus('error');
      setIsUploading(false);
      alert("El archivo debe ser menor a 10MB");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      setUploadStatus('error');
      setIsUploading(false);
      alert("Solo se permiten archivos de imagen (PNG, JPG, SVG)");
      return;
    }

    console.log('✅ File validation passed, reading and compressing file...');

    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new window.Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Comprimir como JPEG al 70% de calidad para reducir dramáticamente el tamaño
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(dataUrl);
            } else {
              reject(new Error("Canvas no soportado"));
            }
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    compressImage(file)
      .then((compressedBase64) => {
        console.log('✅ File compressed and uploaded successfully');
        setValue(name, compressedBase64);
        setUploadStatus('success');
        setIsUploading(false);
      })
      .catch((error) => {
        console.error('❌ Error compressing file:', error);
        setUploadStatus('error');
        setIsUploading(false);
        alert("Error al procesar y comprimir la imagen");
      });
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <div className={`w-full px-4 py-3 bg-zinc-800/50 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer ${
          uploadStatus === 'success'
            ? 'border-green-400 bg-green-500/5 text-green-400'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-500/5 text-red-400'
            : isUploading
            ? 'border-yellow-400 bg-yellow-500/5 text-yellow-400'
            : 'border-zinc-600 text-zinc-400 hover:border-lime-400 hover:bg-lime-500/5'
        }`}>
          {isUploading ? (
            <>
              <div className="animate-spin w-5 h-5 mx-auto mb-1 border-2 border-current border-t-transparent rounded-full"></div>
              <p className="text-sm">Subiendo archivo...</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm">Archivo subido correctamente</p>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm">Error al subir archivo</p>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">{placeholder ?? "Click para seleccionar archivo"}</p>
              <p className="text-xs mt-1">PNG/JPG hasta 10MB (se comprimirá automáticamente)</p>
            </>
          )}
        </div>
      </div>

      {/* Mostrar preview si hay un archivo subido */}
      {currentValue && uploadStatus === 'success' && (
        <div className="mt-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
          <div className="flex justify-center">
            {name === 'logoUrl' ? (
              // Logo: cuadrado, más pequeño, object-cover para ver completo
              <Image
                src={currentValue}
                alt="Preview del logo"
                width={120}
                height={120}
                className="w-24 h-24 object-cover rounded-lg border border-zinc-600"
                unoptimized
              />
            ) : name === 'coverPhotoUrl' ? (
              // Cover photo: usar w-full para ocupar todo el ancho disponible
              <Image
                src={currentValue}
                alt="Preview de portada"
                width={400}
                height={200}
                className="w-full h-auto max-h-24 object-cover rounded-lg border border-zinc-600"
                unoptimized
              />
            ) : (
              // Default fallback
              <Image
                src={currentValue}
                alt="Preview"
                width={240}
                height={160}
                className="max-w-full h-auto max-h-40 object-contain rounded border border-zinc-600"
                unoptimized
              />
            )}
          </div>
        </div>
      )}

      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}
