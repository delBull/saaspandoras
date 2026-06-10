'use client';

import { useState } from 'react';

interface MaskedShortlinkPageProps {
  url: string;
  slug: string;
}

export function MaskedShortlinkPage({ url, slug }: MaskedShortlinkPageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="fixed inset-0 w-full h-full bg-white z-[9999] flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">
            No se pudo cargar el contenido
          </h1>
          <p className="text-gray-600">
            El destino de <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code> no permite ser incrustado.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Abrir en nueva pestaña
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full z-[9999] overflow-hidden bg-white">
      {!loaded && !error && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto" />
            <p className="text-gray-500 text-sm">Cargando...</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-gray-400 hover:text-black underline transition-colors"
            >
              Cargar directamente
            </a>
          </div>
        </div>
      )}
      {!error && (
        <iframe
          src={url}
          className={`w-full h-full border-none shadow-none ${loaded ? '' : 'hidden'}`}
          title={slug}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
