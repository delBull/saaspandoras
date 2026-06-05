'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheckIcon, DocumentTextIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function LegalTab({ project }: { project: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [legalConfig, setLegalConfig] = useState(project.legalConfig || {});

    const handleChange = (key: string, value: string) => {
        setLegalConfig({ ...legalConfig, [key]: value });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/projects/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legalConfig }),
            });

            if (!response.ok) throw new Error('Error al guardar config legal');
            
            toast.success('Configuración legal actualizada');
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error al guardar');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-inject S'Narai default structure if empty (acting as the template)
    const defaults = {
        agreementUrl: legalConfig.agreementUrl || `https://dash.pandoras.finance/legal/agreement/${project.slug}`,
        riskUrl: legalConfig.riskUrl || `https://dash.pandoras.finance/legal/risk-disclosure/${project.slug}`,
        exitClause: legalConfig.exitClause || "Los certificados están sujetos a bloqueo programático y prioridad OTC para miembros DAO. No existe garantía de recompra automática.",
        phaseDynamics: legalConfig.phaseDynamics || "Las fases operan en modalidad de Soft Cap y Hard Cap secuencial. La venta avanza a la siguiente fase al agotar unidades o expirar el tiempo.",
        dossierUrl: legalConfig.dossierUrl || "",
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
                    <div>
                        <h3 className="text-xl font-bold text-white">Configuración Legal y Compliance</h3>
                        <p className="text-zinc-400 text-sm">Define los términos, cláusulas de salida y enlaces a documentos formales del protocolo.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-zinc-500" /> Documentos Base
                        </h4>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Acuerdo Marco de Participación (URL)</label>
                            <input 
                                type="url" 
                                value={legalConfig.agreementUrl !== undefined ? legalConfig.agreementUrl : defaults.agreementUrl}
                                onChange={(e) => handleChange('agreementUrl', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Aviso Integral de Riesgos (URL)</label>
                            <input 
                                type="url" 
                                value={legalConfig.riskUrl !== undefined ? legalConfig.riskUrl : defaults.riskUrl}
                                onChange={(e) => handleChange('riskUrl', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Dossier / Whitepaper (URL)</label>
                            <input 
                                type="url" 
                                value={legalConfig.dossierUrl !== undefined ? legalConfig.dossierUrl : defaults.dossierUrl}
                                onChange={(e) => handleChange('dossierUrl', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-zinc-500" /> Reglas de Negocio
                        </h4>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Cláusulas de Salida / Prioridad OTC</label>
                            <textarea 
                                value={legalConfig.exitClause !== undefined ? legalConfig.exitClause : defaults.exitClause}
                                onChange={(e) => handleChange('exitClause', e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Ej: Venta secundaria habilitada tras 12 meses..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Dinámica de Fases (Visual para inversores)</label>
                            <textarea 
                                value={legalConfig.phaseDynamics !== undefined ? legalConfig.phaseDynamics : defaults.phaseDynamics}
                                onChange={(e) => handleChange('phaseDynamics', e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Ej: Se aumenta el precio $1 USD por fase..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950/50 rounded-lg p-4 border border-emerald-500/20 mb-6 flex items-start gap-3">
                    <CheckBadgeIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        <strong className="text-zinc-200">Integración Automática:</strong> Esta información se inyectará dinámicamente en el Widget de Checkout y en los correos transaccionales de bienvenida enviados a los holders, asegurando el cumplimiento legal On-Chain y Off-Chain (NOM-151 / Equivalentes).
                    </p>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : 'Guardar Configuración Legal'}
                    </button>
                </div>
            </div>
        </div>
    );
}
