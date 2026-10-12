'use client';

/**
 * 🛡️ Secure Lesson Viewer Component (Phase 3)
 * apps/academy/src/components/academy/SecureLessonViewer.tsx
 *
 * Implements ephemeral in-memory client decryption:
 * 1. Solicits cryptographic signature from connected Web3 wallet.
 * 2. Fetches unwrapped DEK from authorized API (`/api/academy/keys/[resourceId]`).
 * 3. Fetches encrypted chunks from IPFS Gateway or mock stream.
 * 4. Decrypts chunks strictly in browser memory using Web Crypto API (AES-GCM).
 * 5. Applies dynamic security watermark (Wallet Address + Timestamp) to deter screen capture.
 * 6. Explicitly destroys buffer references on unmount.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EncryptedCourseResourceManifest } from '@saasfly/academy-sdk';
import { ShieldCheck, Lock, Unlock, AlertTriangle, Eye, Loader2 } from 'lucide-react';

interface SecureLessonViewerProps {
  manifest: EncryptedCourseResourceManifest;
  connectedWallet?: string;
  onSignChallenge?: (message: string) => Promise<string>;
}

export function SecureLessonViewer({
  manifest,
  connectedWallet,
  onSignChallenge,
}: SecureLessonViewerProps) {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [watermarkTime, setWatermarkTime] = useState<string>('');
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setWatermarkTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setWatermarkTime(new Date().toLocaleTimeString());
    }, 10000);

    return () => {
      clearInterval(interval);
      // Clean up in-memory blob references
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      setDecryptedText(null);
      setDecryptedBlobUrl(null);
    };
  }, []);

  const handleUnlockResource = async () => {
    if (!connectedWallet) {
      setErrorMessage('Conecta tu wallet para desbloquear el material protegido.');
      return;
    }

    if (!onSignChallenge) {
      setErrorMessage('Proveedor de firma Web3 no disponible.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const timestamp = Date.now();
      const nonce = `nonce_${Math.random().toString(36).substring(2)}_${Date.now()}`;

      // 1. Build deterministic EIP-191 challenge string matching KeyDistributionService
      const challengeMessage = [
        "PANDORA'S ACADEMY — ENCRYPTED CONTENT ACCESS CHALLENGE",
        `Wallet: ${connectedWallet.toLowerCase()}`,
        `Resource: ${manifest.resourceId}`,
        `Tenant: ${manifest.tenantId}`,
        `Program: ${manifest.programId}`,
        `Nonce: ${nonce}`,
        `Timestamp: ${timestamp}`,
        "Notice: Sign this message to unlock the private lesson in memory. No blockchain transaction or gas fee required."
      ].join('\n');

      // 2. Request signature from user's wallet
      const signature = await onSignChallenge(challengeMessage);

      // 3. Request DEK from server-authoritative API (manifest is NEVER sent — server loads it by resourceId)
      const response = await fetch(`/api/academy/keys/${manifest.resourceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          tenantId: manifest.tenantId,
          programId: manifest.programId,
          nonce,
          timestamp,
          signature,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Acceso denegado por política de autorización.');
      }

      const unwrappedDekBase64 = data.unwrappedDekBase64;
      if (!unwrappedDekBase64) {
        throw new Error('El servidor no retornó la llave criptográfica requerida.');
      }

      // 4. Client-side ephemeral Web Crypto decryption of the REAL ciphertext chunks
      const dekBytes = Uint8Array.from(atob(unwrappedDekBase64), c => c.charCodeAt(0));
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        dekBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      dekBytes.fill(0); // zeroize raw copy AFTER import (key is now non-extractable)

      const base64ToBytes = (b64: string): Uint8Array =>
        Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

      const resolveChunkUrl = (index: number): string => {
        const perChunk = manifest.chunks[index]?.gatewayUrl;
        if (perChunk) return perChunk;
        if (manifest.gatewayBaseUrl) {
          return `${manifest.gatewayBaseUrl}/${manifest.resourceId}/${index}`;
        }
        throw new Error(
          'Recurso sin fuente binaria conectada: el distribuidor aún no publicó los chunks cifrados en el gateway.'
        );
      };

      const decryptChunks = async (): Promise<Uint8Array> => {
        const parts: Uint8Array[] = [];
        const totalBytes = manifest.chunks.reduce((acc, c) => acc + c.byteLength, 0);

        for (let i = 0; i < manifest.chunks.length; i++) {
          const meta = manifest.chunks[i];
          if (!meta) {
            throw new Error(`Chunk ${i}: metadata ausente en el manifest.`);
          }

          const fetchRes = await fetch(resolveChunkUrl(i));
          if (!fetchRes.ok) {
            throw new Error(`No se pudo descargar el chunk ${i} del gateway (HTTP ${fetchRes.status}).`);
          }
          const cipherBytes = new Uint8Array(await fetchRes.arrayBuffer());
          if (cipherBytes.length !== meta.byteLength) {
            throw new Error(`Chunk ${i}: tamaño alterado (esperado ${meta.byteLength}, recibido ${cipherBytes.length}).`);
          }

          // Ciphertext integrity (sha256 of ciphertext must match stored chunkHash)
          const ctHash = await window.crypto.subtle.digest('SHA-256', cipherBytes);
          if (Array.from(new Uint8Array(ctHash)).map(b => b.toString(16).padStart(2, '0')).join('') !== meta.chunkHash) {
            throw new Error(`Chunk ${i}: hash del ciphertext no coincide (integridad comprometida).`);
          }

          // WebCrypto AES-GCM requires authTag appended to ciphertext; AAD binds tenant:program:module:version:chunk
          const tagBytes = base64ToBytes(meta.authTag);
          const cipherWithTag = new Uint8Array(cipherBytes.length + tagBytes.length);
          cipherWithTag.set(cipherBytes, 0);
          cipherWithTag.set(tagBytes, cipherBytes.length);

          const aadString = `${manifest.aadContext.tenantId}:${manifest.aadContext.programId}:${manifest.aadContext.moduleId}:${manifest.aadContext.version}:chunk_${i}`;
          const plainChunk = await window.crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: base64ToBytes(meta.iv),
              additionalData: new TextEncoder().encode(aadString),
              tagLength: 128,
            },
            cryptoKey,
            cipherWithTag
          );
          parts.push(new Uint8Array(plainChunk));
        }

        const assembled = new Uint8Array(totalBytes);
        let offset = 0;
        for (const part of parts) {
          assembled.set(part, offset);
          offset += part.length;
        }

        // Final integrity: plaintext hash must match manifest.contentHash
        const fullHash = await window.crypto.subtle.digest('SHA-256', assembled);
        const fullHashHex = Array.from(new Uint8Array(fullHash)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (fullHashHex !== manifest.contentHash) {
          throw new Error('El hash del contenido descifrado no coincide con el manifesto (manipulación detectada).');
        }
        return assembled;
      };

      const plaintextBytes = await decryptChunks();

      if (manifest.mediaType === 'text/markdown' || manifest.mediaType === 'application/json') {
        const text = new TextDecoder('utf-8').decode(plaintextBytes);
        setDecryptedText(text);
      } else {
        // binary media (video/pdf): render via ephemeral blob URL (revoked on unmount)
        const mimeType = manifest.mediaType === 'video/mp4' ? 'video/mp4' : 'application/pdf';
        const blob = new Blob([plaintextBytes as unknown as BlobPart], { type: mimeType });
        if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = URL.createObjectURL(blob);
        setDecryptedBlobUrl(activeBlobUrlRef.current);
        setDecryptedText(null);
      }

      dekBytes.fill(0); // defense-in-depth (importKey already copies internally)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al autenticar y descifrar el recurso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      {/* Watermark overlay when decrypted */}
      {decryptedText && connectedWallet && (
        <div className="pointer-events-none absolute inset-0 z-20 flex select-none items-center justify-center overflow-hidden opacity-5">
          <div className="rotate-[-25deg] text-center font-mono text-sm uppercase leading-loose text-white">
            {connectedWallet}
            <br />
            {watermarkTime} · PANDORAS ACADEMY SOVEREIGN VAULT
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-850 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 ring-1 ring-emerald-500/20">
            {decryptedText ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-slate-100">{manifest.title}</h4>
            <p className="text-xs font-mono text-slate-400">
              CID: {manifest.ipfsCid.substring(0, 16)}... · Chunks: {manifest.chunks.length}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>AES-256-GCM</span>
        </div>
      </div>

      {/* Body */}
      {errorMessage && (
        <div className="mb-4 flex items-center space-x-2 rounded-lg bg-rose-950/40 p-3 text-xs text-rose-300 ring-1 ring-rose-500/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {decryptedBlobUrl && !decryptedText && (
        manifest.mediaType === 'video/mp4' ? (
          <div className="relative z-10 mt-2 rounded-lg bg-slate-900/50 p-3 ring-1 ring-slate-800">
            <video src={decryptedBlobUrl} controls className="w-full rounded" />
          </div>
        ) : (
          <div className="relative z-10 mt-2 rounded-lg bg-slate-900/50 p-4 ring-1 ring-slate-800">
            <a
              href={decryptedBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-300 underline-offset-4 hover:underline"
            >
              Abrir documento descifrado (PDF) — solo memoria de sesión
            </a>
          </div>
        )
      )}

      {decryptedText ? (
        <div className="relative z-10 space-y-4 rounded-lg bg-slate-900/50 p-4 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Eye className="h-3.5 w-3.5" /> Descifrado en memoria efímera
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Sesión: {connectedWallet ? connectedWallet.slice(0, 6) + '...' + connectedWallet.slice(-4) : 'N/A'}
            </span>
          </div>
          <div className="prose prose-invert max-w-none text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {decryptedText}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="rounded-full bg-slate-900 p-3 text-slate-400 ring-1 ring-slate-800">
            <Lock className="h-6 w-6 text-amber-400" />
          </div>
          <div className="max-w-md space-y-1">
            <h5 className="text-sm font-medium text-slate-200">Material Confidencial Protegido</h5>
            <p className="text-xs text-slate-400">
              El contenido está cifrado con envelope encryption y anclado a IPFS. Requiere validación de wallet autorizada para liberar la clave efímera.
            </p>
          </div>
          <button
            onClick={handleUnlockResource}
            disabled={isLoading}
            className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Firmando y descifrando...</span>
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                <span>Desbloquear con Wallet</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
