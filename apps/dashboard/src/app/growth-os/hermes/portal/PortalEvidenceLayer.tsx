'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle2 } from 'lucide-react';
import { getHermesConfig, saveHermesConfig } from '../settings/actions';

// We need projectSlug for the actions. For now, since it's snarai, we hardcode or fetch.
// Ideally, the portal would know its slug, but we'll use 'snarai' as fallback just like settings does.
export function PortalEvidenceLayer({ tenantId }: { tenantId: string | number }) {
  const [evidenceLayer, setEvidenceLayer] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [slug, setSlug] = useState('snarai'); // HARDCODED FOR DEMO

  useEffect(() => {
    // In a real scenario we fetch slug by tenantId. 
    getHermesConfig('snarai').then((config) => {
      if (config && config.evidenceLayer) {
        setEvidenceLayer(config.evidenceLayer);
      }
    }).catch(console.error);
  }, [tenantId]);

  const addEvidenceClaim = () => {
    setEvidenceLayer([
      ...evidenceLayer,
      {
        id: `ev_${Date.now()}`,
        statement: '',
        classification: 'PUBLIC_FACT',
        verificationStatus: 'PENDING',
        source: '',
        sourceReference: '',
        evidenceType: 'DOCUMENT',
        allowedResponse: '',
        restrictions: '',
        createdBy: 'portal_user',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const updateEvidenceClaim = (id: string, field: string, value: any) => {
    setEvidenceLayer(evidenceLayer.map(claim => 
      claim.id === id ? { ...claim, [field]: value, updatedBy: 'portal_user', updatedAt: new Date().toISOString() } : claim
    ));
  };

  const removeEvidenceClaim = (id: string) => {
    setEvidenceLayer(evidenceLayer.filter(claim => claim.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveHermesConfig(slug, { evidenceLayer });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 p-6 overflow-y-auto">
      <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shrink-0">
        <div>
          <h3 className="text-lg font-light text-amber-400">Evidence-Backed Claims</h3>
          <p className="text-xs text-zinc-400 mt-1">Configura las afirmaciones que Hermes puede usar, respaldadas por tu Data Room.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={addEvidenceClaim}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded-xl"
          >
            + Add Claim
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            {isSaving ? 'Guardando...' : savedSuccess ? 'Guardado ✅' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {evidenceLayer.map((claim) => (
          <div key={claim.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl relative">
            <button 
              onClick={() => removeEvidenceClaim(claim.id)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-300 p-1"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">¿Qué afirmación quieres que Hermes pueda utilizar?</label>
                <input 
                  type="text"
                  value={claim.statement}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'statement', e.target.value)}
                  placeholder="Ej. El certificado es una acción SAPI"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Clasificación</label>
                <select 
                  value={claim.classification}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'classification', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option value="PUBLIC_FACT">General / Dato Público</option>
                  <option value="DOCUMENTED_CLAIM">Product / Documentado</option>
                  <option value="LEGAL_CLAIM">Legal</option>
                  <option value="FINANCIAL_CLAIM">Financial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Fuente</label>
                <input 
                  type="text"
                  value={claim.source}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'source', e.target.value)}
                  placeholder="Documento / URL / Data Room"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Referencia</label>
                <input 
                  type="text"
                  value={claim.sourceReference || ''}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'sourceReference', e.target.value)}
                  placeholder="Sección / página / documento"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">¿Está verificado?</label>
                <select 
                  value={claim.verificationStatus}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'verificationStatus', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="VERIFIED">Verificado ✓</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Respuesta Permitida</label>
                <textarea 
                  value={claim.allowedResponse}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'allowedResponse', e.target.value)}
                  placeholder="Lo que Hermes puede responder..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Restricciones</label>
                <input 
                  type="text"
                  value={claim.restrictions || ''}
                  onChange={(e) => updateEvidenceClaim(claim.id, 'restrictions', e.target.value)}
                  placeholder="Restricciones adicionales..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-4 text-[10px] font-mono text-zinc-500">
              <span>ID: {claim.id}</span>
            </div>
          </div>
        ))}
        {evidenceLayer.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl text-zinc-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>No hay afirmaciones registradas.</p>
            <p className="text-xs mt-1">Añade Claims para dotar a Hermes de conocimiento verificable.</p>
          </div>
        )}
      </div>
    </div>
  );
}
