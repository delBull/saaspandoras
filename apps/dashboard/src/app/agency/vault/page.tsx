'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  UploadCloud, 
  ShieldCheck, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  FileSpreadsheet, 
  ArrowRight,
  Database,
  Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgencyVaultPage() {
  const [file, setFile] = useState<File | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleIngest = async () => {
    if (!file || !agreedTerms) return;
    setIsIngesting(true);
    
    // Simulate ingestion & identity graph federation
    setTimeout(() => {
      setIsIngesting(false);
      setIngestSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-light text-white tracking-tight">Portal de Gestores & Agency Vault</h1>
          </div>
          <p className="text-xs text-zinc-400 font-light">
            Ingesta segura de bases de datos de clientes con aislamiento encriptado AES-256 (Identity Graph Federation).
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
          <Lock className="w-3.5 h-3.5 mr-1" /> Isolated RLS Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Upload Box */}
        <div className="md:col-span-2 space-y-6">
          <div className="border border-zinc-800 rounded-2xl bg-zinc-950/60 p-6 backdrop-blur-xl">
            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              1. Carga de Base de Datos de Contactos (CSV / Excel)
            </h2>

            <div className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl p-8 text-center transition-colors bg-zinc-900/30 relative">
              <input 
                type="file" 
                accept=".csv, .xlsx" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-xs text-zinc-300 font-medium mb-1">
                {file ? file.name : "Arrastra tu archivo CSV/Excel aquí o haz clic para examinar"}
              </p>
              <p className="text-[11px] text-zinc-500">Soporta columnas: Nombre, Email, Teléfono, Presupuesto, Ciudad</p>
            </div>
          </div>

          {/* Legal Agreement Box */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-950/60 p-6 backdrop-blur-xl">
            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. Convenio de Licenciamiento & Deslinde Legal
            </h2>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-2 mb-4 max-h-36 overflow-y-auto leading-relaxed">
              <p className="font-medium text-zinc-300">CLÁUSULA DE FEDERACIÓN DE INTELIGENCIA & PRIVACIDAD:</p>
              <p>1. <strong>Privacidad del Tenant:</strong> Sus datos se almacenan en un contenedor exclusivo (Agency Vault) protegido por Row Level Security (RLS). Ninguna otra agencia ni tercero tendrá acceso a su lista de clientes.</p>
              <p>2. <strong>Patrones Anónimos:</strong> Concede licencia a Pandoras Growth OS y al motor Hermes para ejecutar misiones comerciales y aprender patrones de comportamiento anónimos (sin PII) para optimizar tasas de conversión.</p>
              <p>3. <strong>Deslinde Normativo:</strong> Certifica contar con la autorización explícita de los titulares para contacto comercial.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-900"
              />
              <span className="text-xs text-zinc-300">
                Acepto los Términos del Convenio de Ingesta, Deslinde de Privacidad y Licencia Operativa para Hermes Revenue Engine.
              </span>
            </label>
          </div>

          <Button 
            onClick={handleIngest}
            disabled={!file || !agreedTerms || isIngesting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isIngesting ? "Encriptando & Procesando en Vault..." : "Iniciar Ingesta en Agency Vault"}
            <ArrowRight className="w-4 h-4" />
          </Button>

          {ingestSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">¡Ingesta Exitosa!</p>
                <p className="text-emerald-500/80">La base de datos fue cifrada y federada. Hermes comenzará la evaluación de misiones autónomas.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="border border-zinc-800 rounded-2xl bg-zinc-950/60 p-6">
            <h3 className="text-xs font-mono uppercase text-amber-400 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" /> Estatus del Container
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Tenant ID:</span>
                <span className="font-mono text-zinc-200">VAULT-AGENCY-9021</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Encriptación:</span>
                <span className="text-emerald-400 font-mono">AES-256-GCM</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Contactos Activos:</span>
                <span className="text-zinc-200">1,240 Prospectos</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-400">Motor Asignado:</span>
                <span className="text-amber-400">Hermes AI Revenue Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
