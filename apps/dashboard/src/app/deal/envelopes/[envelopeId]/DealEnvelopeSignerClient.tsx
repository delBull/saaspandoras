"use client";

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, FileText, CheckCircle2, Clock, Lock, KeyRound, 
  Users, Download, X, Copy, Check, ExternalLink, Layers, 
  Activity, Sparkles, PenTool, Fingerprint, FileSignature, 
  AlertTriangle, Loader2, RefreshCw, Eye
} from 'lucide-react';
import { useActiveAccount, ConnectButton, darkTheme } from 'thirdweb/react';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { client } from '@/lib/thirdweb-client';
import { DocumentEnvelope, SignerParticipant } from '@/lib/deal-signing/types';
import { EIP712Builder } from '@/lib/deal-signing/eip712-builder';

const signerWallets = [
  inAppWallet({
    auth: {
      options: ['google', 'apple', 'telegram', 'email', 'passkey'],
      mode: 'popup',
    },
  }),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('io.rabby'),
  createWallet('walletConnect'),
];

interface Props {
  envelope: DocumentEnvelope;
  initialSignerId: string | null;
  rawToken: string | null;
}

type DrawerTab = 'SIGN' | 'SIGNERS' | 'EVIDENCE';

export function DealEnvelopeSignerClient({ envelope: initialEnvelope, initialSignerId }: Props) {
  const [envelope, setEnvelope] = useState<DocumentEnvelope>(initialEnvelope);
  const [activeSignerId, setActiveSignerId] = useState<string | null>(
    initialSignerId || initialEnvelope.signers[0]?.signerId || null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('SIGN');
  
  // Signature Drawing Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasVisualSignature, setHasVisualSignature] = useState(false);
  
  // Signing submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const activeAccount = useActiveAccount();

  const activeSigner = useMemo(() => {
    return envelope.signers.find(s => s.signerId === activeSignerId) || null;
  }, [envelope.signers, activeSignerId]);

  const signedCount = useMemo(() => {
    return envelope.signers.filter(s => s.status === 'SIGNED').length;
  }, [envelope.signers]);

  const progressPercent = Math.round((signedCount / envelope.signers.length) * 100);

  // Copy hash helper
  const copyDocHash = () => {
    navigator.clipboard.writeText(envelope.documentHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasVisualSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0]?.clientX || 0) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0]?.clientY || 0) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#F59E0B'; // Amber accent
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0]?.clientX || 0) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0]?.clientY || 0) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasVisualSignature(false);
  };

  // Execute EIP-712 Cryptographic Signature
  const handleSignDocument = async () => {
    if (!activeAccount) {
      setSigningError('Por favor conecta tu wallet Web3 o In-App para firmar.');
      return;
    }
    if (!activeSigner) {
      setSigningError('No se encontró un firmante activo asignado.');
      return;
    }

    setSigningError(null);
    setIsSubmitting(true);

    try {
      const signedAtEpoch = Math.floor(Date.now() / 1000);
      const typedData = EIP712Builder.buildTypedData({
        envelopeId: envelope.envelopeId,
        organizationId: envelope.organizationId,
        documentTitle: envelope.title,
        documentHash: envelope.documentHash,
        signerEmail: activeSigner.email,
        signerRole: activeSigner.role,
        signedAt: signedAtEpoch,
        chainId: 8453,
      });

      // Request EIP-712 signature from the active wallet
      const signature = await activeAccount.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Submit signature to backend API
      const res = await fetch(`/api/v1/deal-signing/envelopes/${envelope.envelopeId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerId: activeSigner.signerId,
          signerAddress: activeAccount.address,
          signature,
          customStatement: EIP712Builder.DEFAULT_STATEMENT,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Error al procesar la firma en el servidor');
      }

      setEnvelope(data.envelope);
      setSuccessMessage('¡Firma criptográfica EIP-712 registrada exitosamente!');
      setActiveDrawerTab('SIGNERS');

    } catch (err: any) {
      console.error('[DealEnvelopeSignerClient] Signing failed:', err);
      setSigningError(err?.message || 'Error durante la firma criptográfica');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. Header Bar */}
      <header className="h-16 shrink-0 bg-[#0C0C12] border-b border-white/[0.08] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <FileSignature className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white truncate max-w-xs md:max-w-md">
                {envelope.title}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                envelope.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
              }`}>
                {envelope.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE DE FIRMAS'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 truncate flex items-center gap-2">
              <span>ORG: <strong className="text-zinc-400">{envelope.organizationId.toUpperCase()}</strong></span>
              <span>&bull;</span>
              <span>POLÍTICA: <strong className="text-zinc-400">{envelope.signingPolicy}</strong></span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={copyDocHash}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
            title="Copiar Digest SHA-256 del documento"
          >
            <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
            <span>SHA-256: {envelope.documentHash.slice(0, 8)}...</span>
            {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
          </button>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
              isDrawerOpen 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDrawerOpen ? 'OCULTAR DRAWER' : 'DRAWER DE FIRMA'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* Document Viewer Stage */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-[#07070B] relative">
          
          {/* Document Sheet Simulation */}
          <div className="w-full max-w-3xl bg-[#0D0D14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden mb-16 relative">
            
            {/* Document Watermark Header */}
            <div className="bg-[#12121C] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-300">PANDORA'S SOVEREIGN DOCUMENT FABRIC</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                CID: {envelope.canonicalDocumentCid.slice(0, 16)}...
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 md:p-10 space-y-8 text-zinc-300">
              <div className="border-b border-white/[0.06] pb-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-semibold block mb-1">
                  CONTRATO INSTITUCIONAL SOBERANO
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {envelope.title}
                </h2>
                {envelope.description && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {envelope.description}
                  </p>
                )}
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ORGANIZACIÓN</span>
                  <span className="text-white font-medium">{envelope.organizationId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TAMAÑO PDF</span>
                  <span className="text-white font-medium">{(envelope.documentSize / 1024).toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">FIRMANTES</span>
                  <span className="text-white font-medium">{signedCount} de {envelope.signers.length}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">ESTADO</span>
                  <span className={envelope.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}>
                    {envelope.status}
                  </span>
                </div>
              </div>

              {/* Visual Simulated Legal Content Notice */}
              <div className="p-6 rounded-xl border border-white/[0.06] bg-black/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Declaración de Voluntad & Objeto del Acuerdo
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Las partes comparecen de forma voluntaria y autónoma para celebrar el presente acuerdo jurídico vinculado mediante su identificador determinista SHA-256. La suscripción de este documento mediante firma criptográfica EIP-712 constituye prueba plena de aceptación y consentimiento conforme a las leyes mercantiles aplicables.
                </p>
              </div>

              {/* Signed Seals Display Area */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  Sellos Criptográficos de Firmantes
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {envelope.signers.map((signer, idx) => (
                    <div 
                      key={signer.signerId}
                      className={`p-4 rounded-xl border transition-all ${
                        signer.status === 'SIGNED'
                          ? 'bg-emerald-500/[0.03] border-emerald-500/30'
                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {signer.name}
                        </span>
                        {signer.status === 'SIGNED' ? (
                          <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> FIRMADO
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> PENDIENTE
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                        <div>Email: <span className="text-zinc-300">{signer.email}</span></div>
                        {signer.signatureProof && (
                          <>
                            <div className="truncate">
                              Wallet: <span className="text-emerald-300">{signer.signatureProof.signerAddress}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Fecha: {new Date(signer.signatureProof.signedAt).toLocaleString()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Watermark */}
            <div className="bg-[#0C0C12] border-t border-white/[0.06] p-4 text-center text-[10px] font-mono text-zinc-500">
              HASH SHA-256: {envelope.documentHash} &bull; ANCLADO EN SOVEREIGN IPFS
            </div>
          </div>
        </main>

        {/* 3. Right Slide-Over Sovereign Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[420px] shrink-0 bg-[#0C0C12]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-2xl flex flex-col z-30 fixed md:relative right-0 top-16 md:top-0 bottom-0"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      SOVEREIGN SIGN DRAWER
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">PANEL INTERACTIVO DE FIRMA</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Navigation Tabs */}
              <div className="flex border-b border-white/[0.08] bg-black/20 text-xs font-mono">
                <button
                  onClick={() => setActiveDrawerTab('SIGN')}
                  className={`flex-1 py-2.5 text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    activeDrawerTab === 'SIGN'
                      ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/[0.05]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>FIRMAR</span>
                </button>

                <button
                  onClick={() => setActiveDrawerTab('SIGNERS')}
                  className={`flex-1 py-2.5 text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    activeDrawerTab === 'SIGNERS'
                      ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/[0.05]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>FIRMANTES ({signedCount}/{envelope.signers.length})</span>
                </button>

                <button
                  onClick={() => setActiveDrawerTab('EVIDENCE')}
                  className={`flex-1 py-2.5 text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    activeDrawerTab === 'EVIDENCE'
                      ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/[0.05]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>EVIDENCIA</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* TAB 1: SIGNING STUDIO */}
                {activeDrawerTab === 'SIGN' && (
                  <div className="space-y-6">
                    
                    {/* Active Signer Selection / Verification */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-400">FIRMANDO COMO:</span>
                        <span className="font-semibold text-white">{activeSigner?.name}</span>
                      </div>
                      <div className="text-xs font-mono text-amber-300 truncate">
                        {activeSigner?.email}
                      </div>
                    </div>

                    {/* Web3 Connect Wallet Button */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 block">
                        1. CONECTA TU WALLET O IN-APP ACCOUNT
                      </label>
                      <div className="w-full flex justify-center">
                        <ConnectButton
                          client={client}
                          wallets={signerWallets}
                          theme={darkTheme({
                            colors: {
                              modalBg: '#0D0D14',
                              primaryButtonBg: '#F59E0B',
                              primaryButtonText: '#000000',
                            },
                          })}
                          connectButton={{
                            label: 'Conectar Wallet para Firmar',
                            style: { width: '100%', borderRadius: '0.75rem', fontSize: '0.8rem' },
                          }}
                        />
                      </div>
                    </div>

                    {/* Signature Visual Drawing Canvas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono text-zinc-400">
                          2. TRAZO VISUAL DE FIRMA (OPCIONAL)
                        </label>
                        {hasVisualSignature && (
                          <button
                            onClick={clearSignatureCanvas}
                            className="text-[10px] font-mono text-zinc-500 hover:text-amber-400"
                          >
                            LIMPIAR
                          </button>
                        )}
                      </div>

                      <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden relative">
                        <canvas
                          ref={canvasRef}
                          width={370}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-[120px] cursor-crosshair touch-none"
                        />
                        {!hasVisualSignature && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[11px] font-mono text-zinc-600">
                            Dibuja tu trazo de firma aquí
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages & Errors */}
                    {signingError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{signingError}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Submit EIP-712 Signature Button */}
                    <button
                      onClick={handleSignDocument}
                      disabled={isSubmitting || !activeAccount || activeSigner?.status === 'SIGNED'}
                      className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                        activeSigner?.status === 'SIGNED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                          : !activeAccount
                            ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-emerald-500 text-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>FIRMANDO CRIPTOGRÁFICAMENTE...</span>
                        </>
                      ) : activeSigner?.status === 'SIGNED' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>YA HAS FIRMADO ESTE DOCUMENTO</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>FIRMAR CON EIP-712</span>
                        </>
                      )}
                    </button>

                  </div>
                )}

                {/* TAB 2: SIGNERS PIPELINE */}
                {activeDrawerTab === 'SIGNERS' && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-zinc-400">
                      PIPELINE DE FIRMANTES ({signedCount}/{envelope.signers.length} COMPLETADOS)
                    </div>

                    <div className="space-y-3">
                      {envelope.signers.map((signer, idx) => (
                        <div
                          key={signer.signerId}
                          onClick={() => signer.status !== 'SIGNED' && setActiveSignerId(signer.signerId)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            signer.signerId === activeSignerId
                              ? 'bg-amber-500/[0.08] border-amber-500/40'
                              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center">
                                {idx + 1}
                              </span>
                              {signer.name}
                            </span>
                            {signer.status === 'SIGNED' ? (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                FIRMADO
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                PENDIENTE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate">
                            {signer.email}
                          </div>
                          {signer.signatureProof && (
                            <div className="text-[10px] font-mono text-emerald-300 mt-2 truncate pt-1 border-t border-white/[0.04]">
                              Wallet: {signer.signatureProof.signerAddress}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SOVEREIGN EVIDENCE & IPFS */}
                {activeDrawerTab === 'EVIDENCE' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                      <span className="text-zinc-500 block text-[10px]">DOCUMENT CANONICAL SHA-256</span>
                      <div className="text-zinc-200 text-[11px] break-all">
                        {envelope.documentHash}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                      <span className="text-zinc-500 block text-[10px]">PRIMARY KUBO IPFS CID</span>
                      <div className="text-indigo-300 text-[11px] break-all">
                        {envelope.canonicalDocumentCid}
                      </div>
                    </div>

                    {envelope.evidencePackageCid && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/30 space-y-2">
                        <span className="text-emerald-400 block text-[10px] font-bold">
                          EVIDENCE PACKAGE v1 LISTO
                        </span>
                        <div className="text-zinc-200 text-[11px] break-all">
                          CID: {envelope.evidencePackageCid}
                        </div>
                        <a
                          href={`/api/v1/deal-signing/envelopes/${envelope.envelopeId}/evidence`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Evidence Package JSON</span>
                        </a>
                      </div>
                    )}

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 text-[11px] text-zinc-400 leading-relaxed">
                      <strong className="text-white block mb-1">Zero Platform Dependency:</strong>
                      Cualquier firmante puede verificar este contrato y sus firmas EIP-712 de forma autónoma con el archivo <code className="text-amber-300">verify.html</code> incluido en el paquete de evidencias.
                    </div>
                  </div>
                )}

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default DealEnvelopeSignerClient;
