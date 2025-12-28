// Component for managing custom shortlinks
// Allows creation, listing, and editing of shortlinks

'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Trash2 } from 'lucide-react';

interface Shortlink {
  id: number;
  slug: string;
  destinationUrl: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullUrl: string;
}

export function ShortlinksManager() {
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    destinationUrl: '',
    title: '',
    description: '',
  });

  const fetchShortlinks = async () => {
    try {
      const response = await fetch('/api/admin/shortlinks?include_inactive=true');
      if (response.ok) {
        const data = await response.json();
        setShortlinks(data.data || []);
      } else {
        console.error('Failed to fetch shortlinks');
      }
    } catch (error) {
      console.error('Error fetching shortlinks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlinks();
  }, []);

  const handleCreateShortlink = async () => {
    if (!formData.slug || !formData.destinationUrl) {
      alert('Debes ingresar tanto el slug como la URL de destino.');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/shortlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Enlace creado: /${data.data.slug}\n\nURL: ${window.location.origin}/${data.data.slug}`);
        setFormData({ slug: '', destinationUrl: '', title: '', description: '' });
        setShowCreateForm(false);
        fetchShortlinks();
      } else {
        alert(`Error al crear enlace: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating shortlink:', error);
      alert('Hubo un problema conectando con el servidor.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShortlink = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este enlace? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch('/api/admin/shortlinks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setShortlinks(prev => prev.filter(link => link.id !== id));
        alert('Enlace eliminado correctamente.');
      } else {
        const data = await response.json();
        alert(`Error al eliminar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting shortlink:', error);
      alert('Hubo un problema conectando con el servidor.');
    }
  };

  const handleCopyUrl = (shortlink: Shortlink) => {
    const fullUrl = `${window.location.origin}/${shortlink.slug}`;
    navigator.clipboard.writeText(fullUrl);
    alert(`URL copiada: ${fullUrl}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando shortlinks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Shortlinks</h2>
          <p className="text-gray-600">
            Crea y administra tus enlaces personalizados con seguimiento automático
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-lime-400 text-black px-4 py-2 rounded-lg hover:bg-lime-500"
        >
          <Plus className="h-4 w-4" />
          Crear Shortlink
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Crear nuevo shortlink</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">Slug personalizado</label>
              <input
                id="slug"
                type="text"
                placeholder="mi-enlace"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                className="w-full bg-zinc-900/30 p-2 border rounded font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números y guiones. Ej: mi-enlace, promo-2025
              </p>
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium mb-1">URL de destino</label>
              <input
                id="destination"
                type="url"
                placeholder="https://ejemplo.com/pagina"
                value={formData.destinationUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, destinationUrl: e.target.value }))}
                className="w-full bg-zinc-900/30 p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Título (opcional)</label>
              <input
                id="title"
                type="text"
                placeholder="Descripción corta"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-zinc-900/30 p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descripción (opcional)</label>
              <textarea
                id="description"
                placeholder="Descripción detallada..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-zinc-900/30 p-2 border rounded"
              />
            </div>

            {/* URL Preview */}
            {formData.slug && (
              <div className=" rounded p-3">
                <div className="flex items-center gap-2 text-sm text-lime-400">
                  <ExternalLink className="h-4 w-4" />
                  <span>
                    URL generada: <code className="bg-zinc-700/60 px-2 py-1 rounded font-mono">
                      {window.location.origin}/{formData.slug}
                    </code>
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded hover:bg-zinc-900/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateShortlink}
                disabled={creating}
                className="px-4 py-2 bg-lime-400 text-black rounded hover:bg-lime-500 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Shortlink'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortlinks List */}
      <div className="border rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Shortlinks ({shortlinks.length})</h3>
          <p className="text-gray-600 text-sm">Lista completa de enlaces personalizados creados</p>
        </div>
        <div className="p-6">
          {shortlinks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium mb-2">No hay shortlinks aún</h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer enlace personalizado para comenzar a trackear visitas.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-lime-400 text-black px-4 py-2 rounded-lg hover:bg-lime-500"
              >
                Crear primer shortlink
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {shortlinks.map((shortlink) => (
                <div key={shortlink.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="px-2 py-1 rounded text-sm font-mono">
                          /{shortlink.slug}
                        </code>
                        <span className={`text-xs px-2 py-1 rounded ${shortlink.isActive
                            ? 'bg-green-400 text-zinc-800'
                            : 'bg-green-500 text-zinc-800'
                          }`}>
                          {shortlink.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {shortlink.title && (
                        <h4 className="font-medium text-gray-100">{shortlink.title}</h4>
                      )}
                      <a
                        href={shortlink.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lime-300 hover:text-lime-400 text-sm flex items-center gap-1 truncate"
                      >
                        {shortlink.destinationUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {shortlink.description && (
                        <p className="text-gray-300 text-sm mt-1">{shortlink.description}</p>
                      )}
                      <p className="text-gray-300 text-xs mt-1">
                        Creado: {formatDate(shortlink.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleCopyUrl(shortlink)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Copiar URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`/admin/analytics/shortlinks?slug=${shortlink.slug}`}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Ver Analytics"
                      >
                        📊
                      </a>
                      <button
                        onClick={() => handleDeleteShortlink(shortlink.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
