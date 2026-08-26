import React from 'react';
import { 
  ShieldCheck, FileText, Lock, Globe, Cpu, CheckCircle2, 
  Layers, ArrowUpRight, Scale, Clock, Database, KeyRound, 
  ExternalLink, Hash, Award, Check
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "Pandora's Deal Room | Sovereign On-Chain E-Sign & NOM-151 Protocol",
  description: "Institutional specification for multi-party cryptographic document signing, Sovereign IPFS durability, and NOM-151 Mexican legal compliance.",
};

export default function SovereignEsignPage() {
  return (
    <div className="min-h-screen bg-[#07070B] text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] bg-emerald-900/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        
        {/* Document Header & Institutional Bar */}
        <header className="border border-white/[0.08] bg-[#0C0C14]/90 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase font-semibold">
                  PANDORA'S GROWTH OS &bull; DEAL ROOM
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Sovereign On-Chain E-Sign Protocol
                </h1>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                NOM-151 COMPLIANT
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                EIP-712 ON-CHAIN
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Database className="w-3.5 h-3.5" />
                SOVEREIGN IPFS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono text-white/50 pt-2">
            <div>
              <span className="block text-white/30">DOCUMENT REF</span>
              <span className="text-white/80 font-medium">SPEC-SOV-ESIGN-V1</span>
            </div>
            <div>
              <span className="block text-white/30">JURISDICTION</span>
              <span className="text-white/80 font-medium">MEXICO (C. COMERCIO)</span>
            </div>
            <div>
              <span className="block text-white/30">TIME-STAMP STANDARD</span>
              <span className="text-white/80 font-medium">RFC 3161 / ASN.1 DER</span>
            </div>
            <div>
              <span className="block text-white/30">STORAGE ENGINE</span>
              <span className="text-white/80 font-medium">KUBO + PINATA DR</span>
            </div>
          </div>
        </header>

        {/* Executive Abstract */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Executive Declaration
          </div>
          <blockquote className="text-lg sm:text-2xl font-light leading-relaxed text-white/90 border-l-2 border-amber-500/60 pl-6 py-1 bg-gradient-to-r from-amber-500/[0.03] to-transparent rounded-r-xl">
            "Pandora's Deal Room transforma la firma electrónica en un <strong className="text-white font-semibold">activo soberano no permisionado</strong>: los contratos se protegen con hashing inmutable en IPFS propio, firmas criptográficas EIP-712 y Constancias de Conservación oficiales bajo la <strong className="text-amber-300 font-semibold">NOM-151 de México</strong>. Si la plataforma deja de existir, los firmantes retienen la plena posesión y validez jurídica de sus acuerdos directamente desde su wallet."
          </blockquote>
        </section>

        {/* The 3 Pillars of Sovereign E-Sign */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            Los Tres Pilares de la Firma Soberana
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl p-6 space-y-4 hover:border-indigo-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">1. Almacenamiento IPFS Descentralizado</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                El documento original no vive en servidores privados de AWS o DocuSign. Se ancla con su identificador de contenido inmutable (<code className="text-xs text-indigo-300">CID</code>) en nodos Kubo propios con réplicas de contingencia en Pinata y Filecoin.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl p-6 space-y-4 hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">2. Firmas Criptográficas EIP-712</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Cada parte firma el hash del contrato utilizando su clave privada (MetaMask, Coinbase, Ledger o Smart Wallet Thirdweb por Passkeys). La firma genera una prueba matemática <code className="text-xs text-amber-300">(r, s, v)</code> de autoría irrefutable.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl p-6 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">3. Constancia Oficial NOM-151</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Al cerrarse el documento, se genera una estampa de tiempo conforme a la <strong className="text-emerald-300 font-medium">NOM-151-SCFI-2016</strong> emitida por un Prestador de Servicios de Certificación (PSC) acreditado por la Secretaría de Economía.
              </p>
            </div>

          </div>
        </section>

        {/* Legal Validity in Mexico */}
        <section className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Validez Jurídica y Eficacia Probatoria en México
              </h2>
              <p className="text-xs font-mono text-white/40">Código de Comercio (Artículos 89 al 114) & NOM-151-SCFI-2016</p>
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed">
            La legislación mexicana otorga pleno reconocimiento jurídico a los contratos celebrados por medios electrónicos. La combinación de firma criptográfica y estampa NOM-151 satisface con el más alto rigor probatorio los principios rectores exigidos por los tribunales federales:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Principio de Integridad (Art. 90 C.Co.)
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                El digest SHA-256 del archivo PDF garantiza que no ha existido alteración de una sola coma desde el momento del acuerdo. Cualquier modificación posterior invalida automáticamente el hash.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Atribución y No Repudio (Art. 97 C.Co.)
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                El firmante posee control exclusivo de su clave privada (EVM o e.firma SAT). Nadie más puede replicar la firma sin su consentimiento expreso.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Fecha Cierta y Conservación (NOM-151)
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                La constancia emitida por el PSC (formato ASN.1 DER / RFC 3161) otorga fecha cierta indiscutible ante autoridades judiciales, notarías y el SAT.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Soporte Dual: Web3 + e.firma SAT
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Permite la coexistencia de firmas Web3 nativas y firma digital con certificados X.509 de la e.firma del SAT (<code className="text-xs text-white/80">.cer / .key</code>).
              </p>
            </div>
          </div>
        </section>

        {/* Zero-Platform Dependency Deep Dive */}
        <section className="border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.05] to-transparent rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Garantía de Supervivencia Autónoma ("Zero Platform Dependency")
              </h2>
              <p className="text-xs font-mono text-indigo-300/60">¿Qué sucede si Pandora's o el Deal Room dejan de operar?</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-white/70 leading-relaxed">
            <p>
              En las plataformas tradicionales de firma digital, si la empresa quiebra o das de baja tu suscripción, pierdes el acceso a la plataforma de auditoría y al rastro de evidencia.
            </p>
            <p className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-white/90">
              <strong className="text-indigo-300 font-semibold block mb-1">En Pandora's Sovereign Deal Room:</strong>
              El contrato se registra en el Smart Contract público <code className="text-xs text-indigo-200">SovereignDocumentRegistry</code>. Cada firmante recibe su <strong className="text-white">Evidence Certificate Package</strong> (PDF original + firmas EIP-712 + archivo de constancia NOM-151). Con un simple script HTML autónomo guardado en su computadora, cualquier usuario puede verificar la validez matemática y legal del documento consultando cualquier nodo público de Blockchain e IPFS, <strong className="text-amber-300">sin intermediarios ni servidores privados</strong>.
            </p>
          </div>
        </section>

        {/* Institutional Comparison Table */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Matriz Comparativa Institucional
          </h2>

          <div className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-white/40 font-mono text-[11px] uppercase">
                  <th className="p-4 sm:p-5">Atributo</th>
                  <th className="p-4 sm:p-5">DocuSign</th>
                  <th className="p-4 sm:p-5">Mifiel</th>
                  <th className="p-4 sm:p-5 text-indigo-400 bg-indigo-500/[0.05]">Pandora's Deal Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-white/80">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Almacenamiento Documental</td>
                  <td className="p-4 sm:p-5 text-white/50">Centralizado (AWS de DocuSign)</td>
                  <td className="p-4 sm:p-5 text-white/50">Centralizado</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">Soberano IPFS (Kubo + Pinata DR)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Mecanismo Criptográfico</td>
                  <td className="p-4 sm:p-5 text-white/50">Firma simple / Certificado DocuSign</td>
                  <td className="p-4 sm:p-5 text-white/50">e.firma SAT (FIEL)</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">Dual: EIP-712 Web3 + e.firma SAT</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Constancia NOM-151 Oficial</td>
                  <td className="p-4 sm:p-5 text-white/50">Costo extra / Integrador 3rd party</td>
                  <td className="p-4 sm:p-5 text-emerald-400">Sí (Nativo)</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">Sí (Nativo vía PSC Autorizado)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Registro Inmutable On-Chain</td>
                  <td className="p-4 sm:p-5 text-red-400/80">No</td>
                  <td className="p-4 sm:p-5 text-white/50">Parcial (Bitcoin timestamp)</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">EVM Smart Contract (Polygon/Base)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Supervivencia sin el Proveedor</td>
                  <td className="p-4 sm:p-5 text-red-400/80">Pierdes acceso a la prueba</td>
                  <td className="p-4 sm:p-5 text-white/50">Requiere archivo XML local</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">100% Autónomo (Wallet + IPFS)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Integración con Deal Room & RWA</td>
                  <td className="p-4 sm:p-5 text-red-400/80">No disponible</td>
                  <td className="p-4 sm:p-5 text-red-400/80">No disponible</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-medium bg-indigo-500/[0.03]">Nativo (Gobernanza, Claims, Fondos)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Multi-Signer Flow Diagram */}
        <section className="border border-white/[0.08] bg-[#0C0C14] rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Flujo Operativo de Firma Multi-Firmante
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm">FASE 1</span>
              <h4 className="font-semibold text-white">Carga & Definición</h4>
              <p className="text-white/50 leading-relaxed">
                El emisor sube el PDF al Deal Room y define $N$ firmantes con sus roles, emails o wallets obligatorias.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm">FASE 2</span>
              <h4 className="font-semibold text-white">Invitación & Auth</h4>
              <p className="text-white/50 leading-relaxed">
                Los firmantes acceden vía Magic Link. Si no tienen wallet, se crea una Smart Wallet instantánea mediante Passkey.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm">FASE 3</span>
              <h4 className="font-semibold text-white">Firma Criptográfica</h4>
              <p className="text-white/50 leading-relaxed">
                Cada parte revisa el visor y firma el hash con su wallet (EIP-712) o e.firma SAT en un solo clic.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-emerald-400 font-mono font-bold text-sm">FASE 4</span>
              <h4 className="font-semibold text-white">Cierre & NOM-151</h4>
              <p className="text-white/50 leading-relaxed">
                Se estampa la Constancia NOM-151 con el PSC, se publica en IPFS y se notariza la transacción On-Chain.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Specification References */}
        <footer className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
          <div>
            PANDORA'S GROWTH OS &bull; SOVEREIGN ARCHITECTURE
          </div>
          <div className="flex items-center gap-4">
            <Link href="/nexus/rooms" className="hover:text-white flex items-center gap-1 transition-colors">
              Deal Room Console <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
