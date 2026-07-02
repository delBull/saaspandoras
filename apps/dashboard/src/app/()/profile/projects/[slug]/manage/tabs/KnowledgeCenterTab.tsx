'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

interface Briefing {
  id?: number;
  slug: string;
  title: string;
  subtitle: string | null;
  blocks: any[];
  status: string;
}

export function KnowledgeCenterTab({ project }: { project: any }) {
  const account = useActiveAccount();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBriefings = async () => {
    if (!account?.address) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/projects/${project.id}/admin/briefings`, {
        headers: { 'x-wallet-address': account.address }
      });
      if (res.ok) {
        const data = await res.json();
        setBriefings(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar briefings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefings();
  }, [account?.address, project.id]);

  const handleSave = async () => {
    if (!editingBriefing?.slug || !editingBriefing?.title) {
      toast.error('El slug y el título son obligatorios');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/briefings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account?.address || ''
        },
        body: JSON.stringify(editingBriefing)
      });
      
      if (res.ok) {
        toast.success('Briefing guardado con éxito');
        setEditingBriefing(null);
        fetchBriefings();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al guardar');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este Briefing?')) return;
    
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/briefings?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': account?.address || '' }
      });
      
      if (res.ok) {
        toast.success('Eliminado correctamente');
        fetchBriefings();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (e) {
      toast.error('Error de conexión');
    }
  };

  const addBlock = (type: string) => {
    if (!editingBriefing) return;
    
    let defaultData = {};
    if (type === 'hero') {
      defaultData = { title: '', subtitle: '', hook: '' };
    } else if (type === 'sixty_seconds') {
      defaultData = {
        q1: { title: 'Qué es', content: '' },
        q2: { title: 'Cómo funciona', content: '' },
        q3: { title: 'Qué recibes', content: '' },
        q4: { title: 'Qué sigue', content: '' }
      };
    } else if (type === 'journey') {
      defaultData = { steps: ['Descubrir', 'Entender', 'Participar', 'Beneficiarse'] };
    } else if (type === 'principles') {
      defaultData = { principles: ['Principio 1', 'Principio 2'] };
    } else if (type === 'next_steps') {
      defaultData = { steps: [{ title: 'Acción 1', action: '#' }] };
    }

    setEditingBriefing({
      ...editingBriefing,
      blocks: [...editingBriefing.blocks, { type, data: defaultData }]
    });
  };

  const updateBlockData = (index: number, newData: any) => {
    if (!editingBriefing) return;
    const newBlocks = [...editingBriefing.blocks];
    newBlocks[index].data = newData;
    setEditingBriefing({ ...editingBriefing, blocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    if (!editingBriefing) return;
    const newBlocks = [...editingBriefing.blocks];
    newBlocks.splice(index, 1);
    setEditingBriefing({ ...editingBriefing, blocks: newBlocks });
  };

  // -----------------------------------------------------
  // RENDER EDIT MODE
  // -----------------------------------------------------
  if (editingBriefing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <button 
            onClick={() => setEditingBriefing(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Volver al listado
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold px-6 py-2 rounded-lg text-sm transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar Briefing'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Meta Datos */}
          <div className="col-span-1 space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Metadatos del Briefing</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Título Interno</label>
                  <input 
                    type="text" 
                    value={editingBriefing.title}
                    onChange={e => setEditingBriefing({...editingBriefing, title: e.target.value})}
                    placeholder="Ej: Developer Briefing"
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Slug (URL)</label>
                  <input 
                    type="text" 
                    value={editingBriefing.slug}
                    onChange={e => setEditingBriefing({...editingBriefing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                    placeholder="ej: developers"
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">/p/{project.slug}/access/{editingBriefing.slug || '[slug]'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Estado</label>
                  <select 
                    value={editingBriefing.status}
                    onChange={e => setEditingBriefing({...editingBriefing, status: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <PlusIcon className="w-4 h-4 text-emerald-400" />
                Agregar Bloque
              </h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => addBlock('hero')} className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded border border-zinc-800/50">✨ Bloque: Hero de Impacto</button>
                <button onClick={() => addBlock('sixty_seconds')} className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded border border-zinc-800/50">⏱️ Bloque: En 60 Segundos</button>
                <button onClick={() => addBlock('journey')} className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded border border-zinc-800/50">🛤️ Bloque: El Recorrido (Timeline)</button>
                <button onClick={() => addBlock('principles')} className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded border border-zinc-800/50">⚖️ Bloque: Principios</button>
                <button onClick={() => addBlock('next_steps')} className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded border border-zinc-800/50">🎯 Bloque: Siguientes Pasos (CTA)</button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Bloques */}
          <div className="col-span-2 space-y-6">
            {editingBriefing.blocks.length === 0 ? (
              <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Este Briefing está vacío.</p>
                <p className="text-xs">Agrega tu primer bloque usando el menú de la izquierda.</p>
              </div>
            ) : (
              editingBriefing.blocks.map((block, index) => (
                <div key={index} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Bars3BottomLeftIcon className="w-4 h-4" />
                      {block.type === 'hero' ? 'Hero' : block.type.replace('_', ' ')}
                    </span>
                    <button onClick={() => removeBlock(index)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Render Form per block type */}
                    {block.type === 'hero' && (
                      <>
                        <input type="text" placeholder="Título Gigante" value={block.data.title || ''} onChange={e => updateBlockData(index, {...block.data, title: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-lg font-bold" />
                        <input type="text" placeholder="Subtítulo descriptivo" value={block.data.subtitle || ''} onChange={e => updateBlockData(index, {...block.data, subtitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-300 text-sm" />
                        <input type="text" placeholder='Frase Gancho (ej: "El futuro es el acceso")' value={block.data.hook || ''} onChange={e => updateBlockData(index, {...block.data, hook: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-400 text-sm italic" />
                      </>
                    )}
                    
                    {block.type === 'sixty_seconds' && (
                      <div className="grid grid-cols-2 gap-4">
                        {['q1', 'q2', 'q3', 'q4'].map(q => (
                          <div key={q} className="bg-black/50 p-3 rounded border border-zinc-800">
                            <input type="text" placeholder="Título" value={block.data[q]?.title || ''} onChange={e => updateBlockData(index, {...block.data, [q]: {...block.data[q], title: e.target.value}})} className="w-full bg-transparent border-b border-zinc-800 text-white text-xs font-bold mb-2 pb-1 outline-none" />
                            <textarea placeholder="Contenido..." value={block.data[q]?.content || ''} onChange={e => updateBlockData(index, {...block.data, [q]: {...block.data[q], content: e.target.value}})} className="w-full bg-transparent text-zinc-400 text-xs h-20 outline-none resize-none" />
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'journey' && (
                      <div className="space-y-2">
                        {(block.data.steps || []).map((step: string, i: number) => (
                          <input key={i} type="text" value={step} onChange={e => {
                            const newSteps = [...block.data.steps];
                            newSteps[i] = e.target.value;
                            updateBlockData(index, {...block.data, steps: newSteps});
                          }} className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                        ))}
                        <button onClick={() => updateBlockData(index, {...block.data, steps: [...(block.data.steps || []), 'Nuevo paso']})} className="text-xs text-emerald-500 hover:underline">+ Agregar Paso</button>
                      </div>
                    )}

                    {block.type === 'principles' && (
                      <div className="space-y-2">
                        {(block.data.principles || []).map((p: string, i: number) => (
                          <input key={i} type="text" value={p} onChange={e => {
                            const newP = [...block.data.principles];
                            newP[i] = e.target.value;
                            updateBlockData(index, {...block.data, principles: newP});
                          }} className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                        ))}
                        <button onClick={() => updateBlockData(index, {...block.data, principles: [...(block.data.principles || []), 'Nuevo principio']})} className="text-xs text-emerald-500 hover:underline">+ Agregar Principio</button>
                      </div>
                    )}

                    {block.type === 'next_steps' && (
                      <div className="space-y-3">
                        {(block.data.steps || []).map((s: any, i: number) => (
                          <div key={i} className="flex gap-2">
                            <input type="text" placeholder="Título (ej: Explorar Portal)" value={s.title} onChange={e => {
                              const newS = [...block.data.steps];
                              newS[i] = {...newS[i], title: e.target.value};
                              updateBlockData(index, {...block.data, steps: newS});
                            }} className="flex-1 bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                            <input type="text" placeholder="URL (ej: https://...)" value={s.action} onChange={e => {
                              const newS = [...block.data.steps];
                              newS[i] = {...newS[i], action: e.target.value};
                              updateBlockData(index, {...block.data, steps: newS});
                            }} className="flex-1 bg-black border border-zinc-800 rounded p-2 text-zinc-400 text-sm font-mono" />
                          </div>
                        ))}
                        <button onClick={() => updateBlockData(index, {...block.data, steps: [...(block.data.steps || []), {title: 'Nueva acción', action: '#'}]})} className="text-xs text-emerald-500 hover:underline">+ Agregar Acción</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER LIST MODE
  // -----------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Pandora Knowledge Layer (CMS)</h3>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Gestiona los documentos técnicos, pitches y narrativas de tu proyecto. 
            El Briefing Engine utilizará esta información para renderizar automáticamente las páginas públicas bajo una estética institucional premium.
          </p>
        </div>
        <button 
          onClick={() => setEditingBriefing({ slug: '', title: '', subtitle: '', blocks: [], status: 'published' })}
          className="bg-white hover:bg-gray-200 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Crear Briefing
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 animate-pulse">Cargando Briefings...</div>
      ) : briefings.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h4 className="text-white font-bold mb-2">No tienes Briefings activos</h4>
          <p className="text-sm">Crea tu primer Briefing para habilitar el Knowledge Center de tu proyecto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefings.map(briefing => (
            <div key={briefing.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{briefing.title}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-1">/p/{project.slug}/access/{briefing.slug}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold ${briefing.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                  {briefing.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              
              <div className="flex gap-4 items-center mt-6">
                <button 
                  onClick={() => setEditingBriefing(briefing)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Editar Bloques ({briefing.blocks?.length || 0})
                </button>
                <a 
                  href={`/p/${project.slug}/access/${briefing.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Ver Pública ↗
                </a>
                <div className="flex-1" />
                <button 
                  onClick={() => briefing.id && handleDelete(briefing.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
