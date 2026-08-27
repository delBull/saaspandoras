"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSignature, UploadCloud, Users, ShieldCheck, Plus, Trash2, 
  ArrowRight, Search, FileText, CheckCircle2, Clock, 
  Sparkles, Layers, KeyRound, ExternalLink, Loader2, AlertTriangle, Fingerprint
} from 'lucide-react';
import { SigningPolicy, SignerRole } from '@/lib/deal-signing/types';

interface SignerInput {
  name: string;
  email: string;
  role: SignerRole;
}

export function SovereignSignPortalClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'CREATE' | 'LOOKUP' | 'VERIFY'>('CREATE');

  // Form State for Creating Envelope
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('snarai');
  const [signingPolicy, setSigningPolicy] = useState<SigningPolicy>('PARALLEL');
  const [thresholdM, setThresholdM] = useState<number>(2);
  const [signers, setSigners] = useState<SignerInput[]>([
    { name: '', email: '', role: 'SIGNER' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Lookup State
  const [lookupEnvelopeId, setLookupEnvelopeId] = useState('');
  const [lookupOrgId, setLookupOrgId] = useState('snarai');
  const [recentEnvelopes, setRecentEnvelopes] = useState<any[]>([]);
  const [isFetchingRecent, setIsFetchingRecent] = useState(false);

  // Local Hash Verifier State
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addSigner = () => {
    setSigners([...signers, { name: '', email: '', role: 'SIGNER' }]);
  };

  const removeSigner = (index: number) => {
    if (signers.length <= 1) return;
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index: number, field: keyof SignerInput, value: string) => {
    const next = [...signers];
    const item = next[index];
    if (item) {
      (item as any)[field] = value;
      setSigners(next);
    }
  };

  const handleCreateEnvelope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFormError('Por favor selecciona un archivo PDF para el contrato.');
      return;
    }
    if (!title.trim()) {
      setFormError('El título del documento es obligatorio.');
      return;
    }
    if (!organizationId.trim()) {
      setFormError('El identificador de organización (Slug) es obligatorio.');
      return;
    }
    
    // Validate signers
    const validSigners = signers.filter(s => s.name.trim() && s.email.trim());
    if (validSigners.length === 0) {
      setFormError('Debes ingresar al menos un firmante con nombre y correo electrónico válidos.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('organizationId', organizationId.trim().toLowerCase());
      formData.append('signingPolicy', signingPolicy);
      if (signingPolicy === 'M_OF_N') {
        formData.append('thresholdM', thresholdM.toString());
      }
      formData.append('signers', JSON.stringify(validSigners));

      const res = await fetch('/api/v1/deal-signing/envelopes', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Error al crear el envelope de firma');
      }

      // Redirect immediately to the live signing studio
      router.push(`/deal/envelopes/${data.envelope.envelopeId}`);

    } catch (err: any) {
      console.error('[SovereignSignPortal] Error:', err);
      setFormError(err?.message || 'Error al procesar la creación del documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOrgEnvelopes = async () => {
    if (!lookupOrgId.trim()) return;
    setIsFetchingRecent(true);
    try {
      const res = await fetch(`/api/v1/deal-signing/envelopes?organizationId=${lookupOrgId.trim().toLowerCase()}`);
      const data = await res.json();
      if (data.success) {
        setRecentEnvelopes(data.envelopes || []);
      }
    } catch (err) {
      console.error('Error fetching envelopes:', err);
    } finally {
      setIsFetchingRecent(false);
    }
  };

  const handleVerifyFile = async (selectedFile: File) => {
    setVerifyFile(selectedFile);
    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setComputedHash(hashHex);
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navbar */}
      <header className="h-16 shrink-0 bg-[#0C0C12] border-b border-white/[0.08] px-4 md:px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <FileSignature className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <span>PANDORA'S SOVEREIGN SIGN</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                PORTAL v1.0
              </span>
            </h1>
            <p className="text-[11px] font-mono text-zinc-500">
              INFRAESTRUCTURA DE FIRMA CRIPTOGRÁFICA Y EVIDENCIA ON-CHAIN
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs font-mono">
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'CREATE'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>NUEVO DOCUMENTO</span>
          </button>
          
          <button
            onClick={() => setActiveTab('LOOKUP')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'LOOKUP'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>MIS DOCUMENTOS</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFY')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'VERIFY'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUDITOR SHA-256</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6">

          {/* TAB 1: CREATE ENVELOPE */}
          {activeTab === 'CREATE' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl space-y-8"
            >
              <div className="border-b border-white/[0.06] pb-5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-semibold block mb-1">
                  SOVEREIGN SIGN STUDIO
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Crear Nuevo Envelope de Firma Soberana
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Sube tu archivo PDF, define los firmantes y la política de ejecución. El archivo se anclará en Kubo IPFS y Base L2.
                </p>
              </div>

              <form onSubmit={handleCreateEnvelope} className="space-y-6">
                
                {/* 1. PDF File Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-300 block font-semibold">
                    1. DOCUMENTO PDF A FIRMAR
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />
                    <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    {file ? (
                      <div>
                        <p className="text-sm font-semibold text-white">{file.name}</p>
                        <p className="text-xs font-mono text-emerald-400 mt-1">
                          {(file.size / 1024).toFixed(1)} KB &bull; Listo para hashear
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">Arrastra o haz clic para subir tu PDF</p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-1">Se calculará su SHA-256 localmente antes de subirlo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 block">
                      Título del Documento *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Contrato Marco de Inversión Inmobiliaria"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 block">
                      Organización / Proyecto (Slug) *
                    </label>
                    <input
                      type="text"
                      placeholder="snarai"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400 block">
                    Descripción / Objeto del Acuerdo (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Breve descripción jurídica o contexto de la firma..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                {/* 3. Signing Policy */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-300 block font-semibold">
                    2. POLÍTICA DE FIRMA
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'PARALLEL', label: 'Paralela (Sin Orden)', desc: 'Cualquier firmante puede firmar en cualquier momento' },
                      { id: 'SEQUENTIAL', label: 'Secuencial Estricta', desc: 'Firma en orden 1 → 2 → N de forma obligatoria' },
                      { id: 'M_OF_N', label: 'M de N (Umbral)', desc: 'Requiere M firmas mínimas para completarse' },
                    ].map((pol) => (
                      <div
                        key={pol.id}
                        onClick={() => setSigningPolicy(pol.id as SigningPolicy)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          signingPolicy === pol.id
                            ? 'bg-amber-500/[0.08] border-amber-500/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="text-xs font-semibold">{pol.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">{pol.desc}</div>
                      </div>
                    ))}
                  </div>

                  {signingPolicy === 'M_OF_N' && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs font-mono mt-2">
                      <span>Firmas requeridas (M):</span>
                      <input
                        type="number"
                        min={1}
                        max={signers.length || 1}
                        value={thresholdM}
                        onChange={(e) => setThresholdM(parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1 rounded bg-black/60 border border-amber-500/40 text-center text-white"
                      />
                      <span className="text-zinc-500">de {signers.length} firmantes registrados</span>
                    </div>
                  )}
                </div>

                {/* 4. Signers List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-300 font-semibold">
                      3. FIRMANTES ASIGNADOS ({signers.length})
                    </label>
                    <button
                      type="button"
                      onClick={addSigner}
                      className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Firmante
                    </button>
                  </div>

                  <div className="space-y-3">
                    {signers.map((signer, index) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/10 text-xs font-mono flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>

                        <input
                          type="text"
                          placeholder="Nombre Completo"
                          value={signer.name}
                          onChange={(e) => updateSigner(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                        />

                        <input
                          type="email"
                          placeholder="correo@empresa.com"
                          value={signer.email}
                          onChange={(e) => updateSigner(index, 'email', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />

                        <select
                          value={signer.role}
                          onChange={(e) => updateSigner(index, 'role', e.target.value)}
                          className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-300 focus:border-amber-400 focus:outline-none font-mono"
                        >
                          <option value="SIGNER">SIGNER</option>
                          <option value="APPROVER">APPROVER</option>
                          <option value="WITNESS">WITNESS</option>
                        </select>

                        {signers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSigner(index)}
                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-mono font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CREANDO ENVELOPE & SUBIENDO A IPFS...</span>
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4" />
                      <span>CREAR ENVELOPE & ABRIR STUDIO DE FIRMA</span>
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          )}

          {/* TAB 2: LOOKUP ENVELOPES */}
          {activeTab === 'LOOKUP' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Direct Envelope ID Opener */}
              <div className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-semibold text-white font-mono">
                  ABRIR POR ENVELOPE ID O LINK
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Pega el UUID del Envelope (ej. 3d2f1b4a-...)"
                    value={lookupEnvelopeId}
                    onChange={(e) => setLookupEnvelopeId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={() => lookupEnvelopeId.trim() && router.push(`/deal/envelopes/${lookupEnvelopeId.trim()}`)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <span>ABRIR</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Organization Envelopes List */}
              <div className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white font-mono">
                    DOCUMENTOS RECIENTES POR ORGANIZACIÓN
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Slug (ej. snarai)"
                      value={lookupOrgId}
                      onChange={(e) => setLookupOrgId(e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white"
                    />
                    <button
                      onClick={fetchOrgEnvelopes}
                      disabled={isFetchingRecent}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono text-zinc-300 hover:text-white"
                    >
                      {isFetchingRecent ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {recentEnvelopes.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-white/[0.06] rounded-xl">
                      Haz clic en "Buscar" para listar los envelopes de la organización.
                    </div>
                  ) : (
                    recentEnvelopes.map((env) => (
                      <div
                        key={env.id}
                        onClick={() => router.push(`/deal/envelopes/${env.id}`)}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-white">{env.title}</h4>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                            <span>ID: {env.id.slice(0, 8)}...</span>
                            <span>&bull;</span>
                            <span>{new Date(env.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          env.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {env.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: LOCAL SHA-256 AUDITOR */}
          {activeTab === 'VERIFY' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Auditor Criptográfico Local (Zero-Platform)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Calcula el digest SHA-256 de cualquier archivo en tu procesador para verificar que no ha sido alterado.
                </p>
              </div>

              <div
                onClick={() => document.getElementById('auditorInput')?.click()}
                className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-8 text-center cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all"
              >
                <input
                  id="auditorInput"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleVerifyFile(e.target.files[0])}
                />
                <Fingerprint className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-300 font-semibold">Selecciona cualquier archivo PDF o contrato</p>
                <p className="text-[11px] font-mono text-zinc-500 mt-1">Cálculo ejecutado con Web Crypto API (SubtleCrypto)</p>
              </div>

              {computedHash && (
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="text-zinc-400">Digest Canónico SHA-256:</div>
                  <div className="text-amber-300 text-[11px] break-all bg-white/[0.03] p-2.5 rounded-lg border border-white/5">
                    {computedHash}
                  </div>
                  <div className="text-emerald-400 text-[10px] flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Calculado con éxito. Puedes comparar este hash con el Evidence Package o el registro on-chain.</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

export default SovereignSignPortalClient;
