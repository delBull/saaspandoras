"use client";

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Trash2, BarChart3, Users, TrendingUp, Eye } from 'lucide-react';

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

interface ShortlinksStats {
  total: number;
  active: number;
  totalClicks: number;
  uniqueVisitors: number;
}

export default function ShortlinksSubTab() {
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [stats, setStats] = useState<ShortlinksStats>({ total: 0, active: 0, totalClicks: 0, uniqueVisitors: 0 });
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
        const shortlinksData = data.data || [];
        setShortlinks(shortlinksData);

        // Calculate stats
        setStats({
          total: shortlinksData.length,
          active: shortlinksData.filter((s: Shortlink) => s.isActive).length,
          totalClicks: 0, // Would come from analytics API
          uniqueVisitors: 0, // Would come from analytics API
        });
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

  const handleCopyUrl = (shortlink: Shortlink) => {
    const fullUrl = `${window.location.origin}/${shortlink.slug}`;
    navigator.clipboard.writeText(fullUrl);
    alert(`URL copiada: ${fullUrl}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      {/* Estads cards rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              <p className="text-xs text-zinc-400">Total Links</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              <p className="text-xs text-zinc-400">Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{stats.totalClicks}</p>
            <p className="text-xs text-zinc-400">Total Clicks</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">{stats.uniqueVisitors}</p>
            <p className="text-xs text-zinc-400">Visitas Únicas</p>
          </div>
        </div>
      </div>

      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-green-400">🔗 Gestión de Shortlinks</h3>
          <p className="text-zinc-400 text-sm">
            Crea y administra tus enlaces personalizados con seguimiento automático
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Crear Link
        </button>
      </div>

      {/* Create Form - Collapsible */}
      {showCreateForm && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <h4 className="font-semibold mb-4 text-white">Crear nuevo shortlink</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1 text-zinc-300">Slug personalizado</label>
                <input
                  id="slug"
                  type="text"
                  placeholder="mi-enlace"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  className="w-full bg-zinc-900/30 p-2 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:border-blue-500 outline-none font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1 text-zinc-300">Título (opcional)</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Descripción corta"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-900/30 p-2 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium mb-1 text-zinc-300">URL de destino</label>
              <input
                id="destination"
                type="url"
                placeholder="https://ejemplo.com/pagina"
                value={formData.destinationUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, destinationUrl: e.target.value }))}
                className="w-full bg-zinc-900/30 p-2 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 text-zinc-300">Descripción (opcional)</label>
              <textarea
                id="description"
                placeholder="Descripción detallada..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-zinc-900/30 p-2 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* URL Preview */}
            {formData.slug && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                <div className="flex items-center gap-2 text-sm text-blue-400">
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
                className="px-4 py-2 border border-zinc-600 rounded hover:bg-zinc-800/20 text-zinc-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateShortlink}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Shortlink'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortlinks List */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-700">
          <h4 className="font-medium text-white">Shortlinks ({shortlinks.length})</h4>
          <p className="text-zinc-400 text-sm">Enlaces personalizados activos</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-zinc-400">Cargando shortlinks...</p>
          </div>
        ) : shortlinks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-4">🔗</div>
            <h4 className="font-medium mb-2 text-zinc-300">No hay shortlinks aún</h4>
            <p className="text-zinc-500 mb-4 text-sm">
              Crea tu primer enlace personalizado para comenzar a trackear visitas.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear primer link
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-700">
            {shortlinks.map((shortlink) => (
              <div key={shortlink.id} className="p-4 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="px-2 py-1 rounded text-sm font-mono bg-zinc-700 text-green-400">
                        /{shortlink.slug}
                      </code>
                      <span className={`text-xs px-2 py-1 rounded ${
                        shortlink.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {shortlink.isActive ? '✓ Activo' : '⏸️ Inactivo'}
                      </span>
                    </div>
                    {shortlink.title && (
                      <h5 className="font-medium text-white">{shortlink.title}</h5>
                    )}
                    <a
                      href={shortlink.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 truncate"
                    >
                      {shortlink.destinationUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {shortlink.description && (
                      <p className="text-zinc-300 text-sm mt-1">{shortlink.description}</p>
                    )}
                    <p className="text-zinc-500 text-xs mt-1">
                      Creado: {formatDate(shortlink.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleCopyUrl(shortlink)}
                      className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`/admin/analytics/shortlinks?slug=${shortlink.slug}`}
                      className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                      title="Ver Analytics"
                    >
                      📊
                    </a>
                    <button
                      onClick={() => alert('Eliminar shortlinks próximamente')}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
  );
}
